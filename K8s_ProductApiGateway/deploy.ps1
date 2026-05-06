# ============================================================
# deploy.ps1 - Full deployment script for K8s ProductApi Demo
# Run from the repo root: .\deploy.ps1
# ============================================================

# --- Variables -----------------------------------------------
$RESOURCE_GROUP = "azurek8-rg"
$LOCATION       = "polandcentral"
$CLUSTER_NAME   = "azurek8-cluster"

# --- Create the resource group --------------------------------
az group create `
  --name $RESOURCE_GROUP `
  --location $LOCATION

# --- Create a basic AKS cluster ------------------------------
az aks create `
  --resource-group $RESOURCE_GROUP `
  --name $CLUSTER_NAME `
  --location $LOCATION `
  --node-count 2 `
  --node-vm-size Standard_D2s_v3 `
  --tier free `
  --generate-ssh-keys

# --- Download kubeconfig credentials for kubectl -------------
az aks get-credentials `
  --resource-group $RESOURCE_GROUP `
  --name $CLUSTER_NAME `
  --overwrite-existing

kubectl config use-context $CLUSTER_NAME

# --- Shared secrets (MySQL + Redis/Envoy connection settings) -
# --- Store the ZeroSSL EAB HMAC key (defined in secrets.yaml) ---
# Edit secrets.yaml first: replace <your-eab-hmac-key> with your actual key from https://app.zerossl.com/developer
kubectl apply -f namespaces.yaml
kubectl apply -f secrets.yaml

# --- MySQL ---------------------------------------------------
kubectl apply -f mysql/mysql-statefulset.yaml
kubectl apply -f mysql/mysql-service.yaml

# --- Redis + headless service --------------------------------
kubectl apply -f redis/redis-statefulset.yaml
kubectl apply -f redis/redis-service.yaml

# --- Envoy config + deployment + service ---------------------
kubectl apply -f redis/envoy-configmap.yaml
kubectl apply -f redis/envoy-deployment.yaml
kubectl apply -f redis/envoy-service.yaml

# --- Spring Boot API deployment + service --------------------
kubectl apply -f springbootapp/springbootapp-deployment.yaml
kubectl apply -f springbootapp/springbootapp-service.yaml

# --- Install Helm repos and deploy Prometheus / Grafana ------
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

helm upgrade --install prometheus prometheus-community/prometheus
helm upgrade --install grafana grafana/grafana -f prometheus-grafana/grafana-values.yaml

kubectl apply -f redis/redis-statefulset-exporter.yaml
kubectl apply -f prometheus-grafana/prometheus-server-cm-redis.yaml

# --- Enable the managed Application Routing add-on -----------
az aks approuting enable `
  --resource-group $RESOURCE_GROUP `
  --name $CLUSTER_NAME

# --- Install cert-manager ------------------------------------
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.17.2/cert-manager.yaml

# --- Wait for cert-manager to be ready before applying its secret ---
kubectl rollout status deployment/cert-manager -n cert-manager


# --- Create the ClusterIssuer --------------------------------
kubectl apply -f secrets.yaml
kubectl apply -f cert-manager/cluster-issuer.yaml


# --- Get the external IP of the Application Routing ingress controller ---
$INGRESS_IP = $(kubectl get svc -n app-routing-system nginx -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
Write-Host "Ingress IP: $INGRESS_IP"

# --- Deploy the Spring Boot API with Helm --------------------
helm upgrade --install my-app ./my-chart `
  --set ingress.host="product-api.$INGRESS_IP.nip.io" `
  --set ingress.grafanaHost="grafana.$INGRESS_IP.nip.io"





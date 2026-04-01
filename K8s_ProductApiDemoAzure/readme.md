# Azure AKS bootstrap

Objectives
- Deploy the Kubernetes demo repository to a basic Azure Kubernetes Service (AKS) cluster.

## K8 architecture overview

Control plane components:
- etcd: A distributed key-value store that Kubernetes uses to store all cluster data.
- kube-apiserver: The API server that serves the Kubernetes API and acts as the frontend for the Kubernetes control plane.
- kube-scheduler: The component responsible for scheduling Pods onto Nodes based on resource availability and other constraints.
- kube-controller-manager: A component that runs various controllers to manage the state of the cluster, such as node lifecycle, replication, and endpoint management.
- cloud-controller-manager: A component that integrates with cloud providers to manage cloud-specific resources, such as load balancers, storage, and networking.

Node components:
- kubelet: An agent that runs on each Node and ensures that containers are running in a Pod.
- kube-proxy: A network proxy that runs on each Node and maintains network rules to allow communication between Pods and Services.
- Container runtime: The software responsible for running containers, such as Docker.

Addon components:
- CoreDNS: A DNS server that provides name resolution for services and Pods within the cluster.

Kubernetes creates DNS records for Services and Pods. You can contact Services with consistent DNS names instead of IP addresses.

**ClusterIP** — internal-only virtual IP; DNS resolves to the ClusterIP and kube-proxy routes traffic to the backing Pods.

![ClusterIP diagram](dns-diagrams/clusterip_diagram.svg)

**Headless** — no ClusterIP is allocated; DNS resolves directly to individual Pod IPs, giving clients full control over load balancing.

![Headless diagram](dns-diagrams/headless_diagram.svg)

**LoadBalancer** — builds on ClusterIP and provisions a cloud load balancer with a public IP so external traffic can reach the Service.

![LoadBalancer diagram](dns-diagrams/loadbalancer_diagram.svg)





## Prerequisites

- Azure CLI installed (`az`)
Windows (PowerShell):
```powershell
winget install --exact --id Microsoft.AzureCLI
```

Ubuntu:
```bash
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

```bash
az version
```

- `kubectl` installed
- Access to an Azure subscription
- Azure CLI version that supports `--node-provisioning-mode` and `--node-provisioning-default-pools` for AKS

### Step 1: Select subscription

Log in with `az login` and select your subscription.

```powershell
$SUBSCRIPTION_ID="your-subscription-id-or-name"
az account set --subscription $SUBSCRIPTION_ID
```

### Step 2: Create a resource group

Set the resource group name, location, and cluster name.

```powershell
# Variables
$RESOURCE_GROUP="azurek8-rg"
$LOCATION="westeurope"
$CLUSTER_NAME="azurek8-cluster"


# Create the resource group
az group create `
  --name $RESOURCE_GROUP `
  --location $LOCATION
```

### Step 3: Create an AKS cluster

Create:
- a basic AKS cluster named `azurek8-cluster`
- AKS node auto-provisioning with the default [Karpenter-backed](https://karpenter.sh/) node pools

> For demo purposes, use AKS node auto-provisioning instead of a fixed `--node-count` value.

```powershell
# Create a basic AKS cluster with node auto-provisioning enabled
az aks create `
  --resource-group $RESOURCE_GROUP `
  --name $CLUSTER_NAME `
  --generate-ssh-keys `
  --tier free `
  --node-provisioning-mode Auto `
  --node-provisioning-default-pools Auto
```

### Step 4: Switch to the AKS context

Download kubeconfig credentials for `kubectl`.

```powershell
az aks get-credentials `
  --resource-group $RESOURCE_GROUP `
  --name $CLUSTER_NAME `
  --overwrite-existing
```

Switch to the AKS context:

```powershell
kubectl config use-context $CLUSTER_NAME

# Verify the cluster is available
kubectl get nodes
kubectl get pods -A
```

### Step 5: Optional checks

Confirm the Azure resources were created successfully:

```powershell
az group show --name azurek8-rg --output table
az aks show --resource-group azurek8-rg --name azurek8-cluster --output table
az aks nodepool list --resource-group azurek8-rg --cluster-name azurek8-cluster --output table
```

### Step 6: Apply the manifests from the product-api demo

Apply manifests in the same order used in product-api demo.

```powershell
# Shared secrets (MySQL + Redis/Envoy connection settings)
kubectl apply -f secrets.yaml
kubectl apply -f namespaces.yaml

# MySQL
kubectl apply -f mysql/mysql-statefulset.yaml
kubectl apply -f mysql/mysql-service.yaml

# Redis + headless service
kubectl apply -f redis/redis-statefulset.yaml
kubectl apply -f redis/redis-service.yaml

# Envoy config + deployment + service
kubectl apply -f redis/envoy-configmap.yaml
kubectl apply -f redis/envoy-deployment.yaml
kubectl apply -f redis/envoy-service.yaml

# Spring Boot API deployment + service
kubectl apply -f springbootapp/springbootapp-deployment.yaml
kubectl apply -f springbootapp/springbootapp-service.yaml
```

Check rollout and resource health:

```powershell
kubectl rollout status statefulset/mysql
kubectl rollout status statefulset/sharded-redis
kubectl rollout status deployment/envoy
kubectl rollout status deployment/product-api

kubectl get pods
kubectl get svc
kubectl get endpoints redis
```

Get the public endpoint for `product-api` (AKS LoadBalancer):

```powershell
kubectl get svc product-api -w
```

When `EXTERNAL-IP` is assigned, test the API:

```powershell
$APP_IP="<external-ip>"

curl.exe -X POST "http://$APP_IP/api/products" `
  -H "Content-Type: application/json" `
  -d '{"name":"Laptop","description":"High-performance laptop","price":1299.99,"quantity":50}'

curl.exe "http://$APP_IP/api/products/1"

curl.exe -X PUT "http://$APP_IP/api/products/1" `
  -H "Content-Type: application/json" `
  -d '{"name":"Gaming Laptop","description":"High-end gaming laptop","price":1599.99,"quantity":30}'
```

If you update the image or configuration later:

```powershell
kubectl rollout restart deployment/product-api
kubectl rollout status deployment/product-api
```

#### Optional monitoring steps (Prometheus + Grafana)

Install Helm repos and deploy charts used by this repo:

```powershell
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

helm upgrade --install prometheus prometheus-community/prometheus
helm upgrade --install grafana grafana/grafana -f prometheus-grafana/grafana-values.yaml
```

Enable Redis exporter sidecar and Prometheus scrape config:

```powershell
kubectl apply -f redis/redis-statefulset-exporter.yaml
kubectl rollout status statefulset/sharded-redis

kubectl apply -f prometheus-grafana/prometheus-server-cm-redis.yaml
kubectl rollout restart deployment/prometheus-server
kubectl rollout status deployment/prometheus-server
```

Useful checks:

```powershell
helm list
kubectl get pods
kubectl get svc
kubectl get configmap prometheus-server -o yaml | findstr "job_name"
```

Before cleanup, expose Prometheus and Grafana with `LoadBalancer` Services in AKS:

```powershell
kubectl patch svc prometheus-server -p '{\"spec\":{\"type\":\"LoadBalancer\"}}'
kubectl patch svc grafana -p '{\"spec\":{\"type\":\"LoadBalancer\"}}'

kubectl get svc prometheus-server -w
kubectl get svc grafana -w
```

Optional direct checks after external IPs are assigned:

```powershell
kubectl get svc prometheus-server
kubectl get svc grafana
```


Get the admin password:

```bash
kubectl get secret grafana -o jsonpath="{.data.admin-password}" | %{[System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($_))}
```


Inspect logs with:

```powershell
kubectl logs deploy/product-api
kubectl logs deploy/envoy
kubectl get pods -l app=redis
kubectl get pods -l app=mysql
```

### Step 7: Verify service types on the cluster

Inspect the three service types shown in the architecture diagrams above.

**ClusterIP** — internal virtual IP, used by Envoy:

```powershell
kubectl get svc envoy -n data
kubectl describe svc envoy -n data
```

Expected: `Type: ClusterIP`, a stable `CLUSTER-IP` assigned, no `EXTERNAL-IP`. Verify DNS resolves to the single ClusterIP:

```powershell
kubectl run dns-test --image=busybox:1.28 --restart=Never -it --rm -n data `
  -- nslookup envoy.data.svc.cluster.local
```

Expected: a single A record pointing to the ClusterIP address.

To demonstrate that the ClusterIP stays stable even after the Pod is rescheduled, note the IP before, delete the Pod, then resolve again:

```powershell
# 1 — record the current ClusterIP
kubectl run dns-test --image=busybox:1.28 --restart=Never -it --rm -n data `
  -- nslookup envoy.data.svc.cluster.local

# 2 — delete the Envoy Pod (Deployment will reschedule it with a new Pod IP)
kubectl delete pod -l app=envoy -n data

# 3 — wait for the new Pod to be ready
kubectl rollout status deployment/envoy -n data

# 4 — resolve again: ClusterIP is unchanged
kubectl run dns-test --image=busybox:1.28 --restart=Never -it --rm -n data `
  -- nslookup envoy.data.svc.cluster.local
```

Expected: the A record returns the **same ClusterIP** both times, even though the underlying Pod IP has changed.

**Headless** — no ClusterIP, DNS resolves directly to Pod IPs, used by Redis shards:

```powershell
kubectl get svc redis -n data
kubectl describe svc redis -n data
```

Expected: `Type: ClusterIP`, `CLUSTER-IP: None`. Verify DNS resolves to individual Pod IPs:

```powershell
kubectl run dns-test --image=busybox:1.28 --restart=Never -it --rm -n data `
  -- nslookup redis.data.svc.cluster.local
```

Each Redis Pod (`sharded-redis-0`, `sharded-redis-1`, `sharded-redis-2`) should appear as a separate A record.

To demonstrate that Pod IPs **do change** after a Pod is rescheduled (contrast with ClusterIP above):

```powershell
# 1 — record the current Pod IPs
kubectl run dns-test --image=busybox:1.28 --restart=Never -it --rm -n data `
  -- nslookup redis.data.svc.cluster.local

# 2 — delete one Redis Pod (StatefulSet will reschedule it)
kubectl delete pod sharded-redis-0 -n data

# 3 — wait for the Pod to be ready again
kubectl rollout status statefulset/sharded-redis -n data

# 4 — resolve again: the A record for sharded-redis-0 now points to a new IP
kubectl run dns-test --image=busybox:1.28 --restart=Never -it --rm -n data `
  -- nslookup redis.data.svc.cluster.local
```

Expected: the A record for `sharded-redis-0` returns a **different IP** after rescheduling, while the other shards are unchanged.

**LoadBalancer** — public IP, used by the Spring Boot API:

```powershell
kubectl get svc product-api -n app
kubectl describe svc product-api -n app
```

Expected: `Type: LoadBalancer`, a public `EXTERNAL-IP` assigned by Azure.

**MySQL StatefulSet rollout** — confirm the StatefulSet is fully rolled out before testing DNS:

```powershell
kubectl rollout status statefulset/mysql -n data
```

Verify DNS resolves to the MySQL Pod IP via the headless governing service:

```powershell
kubectl run dns-test --image=busybox:1.28 --restart=Never -it --rm -n data `
  -- nslookup mysql.data.svc.cluster.local
```

Expected: a single A record pointing directly to the `mysql-0` Pod IP.

### Step 8: Ingress

An NGINX ingress controller provides a single public IP entry point and routes HTTP traffic to internal ClusterIP services by path or hostname — replacing the need for a `LoadBalancer` service per application.

`springbootapp-service.yaml` has been updated to `type: ClusterIP`. External traffic now flows through the ingress controller only.

Install the NGINX ingress controller via Helm:

```powershell
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx `
  --namespace ingress-nginx `
  --create-namespace `
  --set controller.service.type=LoadBalancer
```

Wait for the controller to get its public IP:

```powershell
kubectl get svc ingress-nginx-controller -n ingress-nginx -w
```

Apply the updated service and ingress manifest:

```powershell
kubectl apply -f springbootapp/springbootapp-service.yaml
kubectl apply -f springbootapp/springbootapp-ingress.yaml
```

Verify the ingress resource:

```powershell
kubectl get ingress -n app
kubectl describe ingress product-api -n app
```

Expected: `ADDRESS` is the same public IP as the ingress controller. Test the API through the ingress:

```powershell
$INGRESS_IP=$(kubectl get svc ingress-nginx-controller -n ingress-nginx `
  -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

curl.exe "http://$INGRESS_IP/api/products"

curl.exe -X POST "http://$INGRESS_IP/api/products" `
  -H "Content-Type: application/json" `
  -d '{"name":"Laptop","description":"High-performance laptop","price":1299.99,"quantity":50}'

curl.exe "http://$INGRESS_IP/api/products/1"
```

### Step 9: Cleanup (delete the Azure resource group)

Delete the entire resource group to remove the AKS cluster and all related Azure resources.

```powershell
$RESOURCE_GROUP="azurek8-rg"

az group delete `
  --name $RESOURCE_GROUP `
  --yes `
```

Optional check:

```powershell
az group exists --name azurek8-rg
```

### Development Notes

Architecture documentation, dns-diagrams developed with assistance from Claude AI (Anthropic).

```text
Anthropic. (2026). Claude [claude-sonnet-4-5-20250929].
https://claude.ai
```

Kubernetes manifests also developed
with assistance from GitHub Copilot (Microsoft).

```text
Microsoft. (2026). GitHub Copilot [GPT-4o].
https://github.com/features/copilot
```

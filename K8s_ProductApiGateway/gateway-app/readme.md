# Spring Cloud Gateway + Keycloak Demo

## Project Setup

### 1. Add `keycloak` to hosts file 
Run once, as Administrator so token fetch URLs match the `iss` claim that Keycloak embeds inside Docker (`http://keycloak:8080`).

```powershell
Add-Content -Path "C:\Windows\System32\drivers\etc\hosts" -Value "127.0.0.1 keycloak"
```

### 2. Start the stack

```
docker-compose up
```

### Rebuild and restart a single service

After changing and rebuilding `product-service` or `gateway`:
```powershell
# Rebuild the JAR and Docker image first, then:
docker compose up -d --no-deps --build product-api
docker compose up -d --no-deps --build gateway
```


```powershell
# testuser — ROLE_USER (read-only)
$USER_TOKEN = (Invoke-RestMethod -Method Post -Uri "http://keycloak:8080/realms/demo/protocol/openid-connect/token" `
  -ContentType "application/x-www-form-urlencoded" `
  -Body "client_id=gateway-client&client_secret=changeme-client-secret&grant_type=password&username=testuser&password=password").access_token
```

```powershell
# adminuser — ROLE_USER + ROLE_ADMIN (full access)
$ADMIN_TOKEN = (Invoke-RestMethod -Method Post -Uri "http://keycloak:8080/realms/demo/protocol/openid-connect/token" `
  -ContentType "application/x-www-form-urlencoded" `
  -Body "client_id=gateway-client&client_secret=changeme-client-secret&grant_type=password&username=adminuser&password=password").access_token
```

```powershell
Write-Host "USER_TOKEN : $USER_TOKEN"
Write-Host "ADMIN_TOKEN: $ADMIN_TOKEN"
```

```powershell
# 401 — no token
try { Invoke-RestMethod -Uri "http://localhost:8082/api/products" } catch { $_.Exception.Response.StatusCode.value__ }
```

```powershell
# 403 — valid token but ROLE_USER cannot create
try {
  Invoke-RestMethod -Method Post -Uri "http://localhost:8082/api/products" `
    -Headers @{ Authorization = "Bearer $USER_TOKEN" } `
    -ContentType "application/json" `
    -Body '{"name":"Laptop","description":"Gaming laptop","price":1299.99,"quantity":10}'
} catch { $_.Exception.Response.StatusCode.value__ }
```

```powershell
# 201 — admin creates a product
Invoke-RestMethod -Method Post -Uri "http://localhost:8082/api/products" `
  -Headers @{ Authorization = "Bearer $ADMIN_TOKEN" } `
  -ContentType "application/json" `
  -Body '{"name":"Laptop","description":"Gaming laptop","price":1299.99,"quantity":10}'
```

```powershell
# 200 — read the created product
Invoke-RestMethod -Uri "http://localhost:8082/api/products/1" `
  -Headers @{ Authorization = "Bearer $USER_TOKEN" }
```

```powershell
# 403 — user cannot delete
try {
  Invoke-RestMethod -Method Delete -Uri "http://localhost:8082/api/products/1" `
    -Headers @{ Authorization = "Bearer $USER_TOKEN" }
} catch { $_.Exception.Response.StatusCode.value__ }
```

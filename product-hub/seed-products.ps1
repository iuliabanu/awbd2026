# seed-products.ps1
# Fetches an admin token from Keycloak and inserts 20 products via the gateway.
#
#   .\seed-products.ps1

param(
    [string]$GatewayBase  = "http://localhost:8081",
    [string]$KeycloakBase = "http://localhost:8080"
)

# ---------------------------------------------------------------------------
# Step 1 — Get admin token
# ---------------------------------------------------------------------------
Write-Host "Fetching admin token from $KeycloakBase ..." -ForegroundColor Cyan

$ADMIN_TOKEN = (Invoke-RestMethod -Method Post -Uri "$KeycloakBase/realms/demo/protocol/openid-connect/token" -ContentType "application/x-www-form-urlencoded" -Body "client_id=gateway-client&client_secret=changeme-client-secret&grant_type=password&username=adminuser&password=password").access_token

if (-not $ADMIN_TOKEN) {
    Write-Error "Failed to obtain admin token. Check Keycloak is running and credentials are correct."
    exit 1
}

Write-Host "Token obtained successfully." -ForegroundColor Green

# ---------------------------------------------------------------------------
# Step 2 — Product catalogue (22 items — includes edge-case stock scenarios)
# ---------------------------------------------------------------------------
$products = @(
    @{ name = "Laptop";            description = "High-performance gaming laptop";       price = 1299.99; quantity = 10  },
    @{ name = "Monitor";           description = "4K UHD 27-inch display";              price = 599.99;  quantity = 25  },
    @{ name = "Keyboard";          description = "Mechanical RGB keyboard";             price = 129.99;  quantity = 50  },
    @{ name = "Mouse";             description = "Wireless ergonomic mouse";            price = 49.99;   quantity = 100 },
    @{ name = "Headphones";        description = "Noise-cancelling over-ear headphones";price = 249.99;  quantity = 30  },
    @{ name = "Webcam";            description = "1080p HD USB webcam";                 price = 89.99;   quantity = 40  },
    @{ name = "SSD 1TB";           description = "NVMe M.2 solid state drive";         price = 109.99;  quantity = 60  },
    @{ name = "USB Hub";           description = "7-port USB 3.0 hub";                 price = 34.99;   quantity = 75  },
    @{ name = "Desk Lamp";         description = "LED desk lamp with USB charging";    price = 29.99;   quantity = 80  },
    @{ name = "Smartphone Stand";  description = "Adjustable aluminium phone stand";   price = 19.99;   quantity = 120 },
    @{ name = "Graphics Card";     description = "8GB GDDR6 dedicated GPU";            price = 449.99;  quantity = 8   },
    @{ name = "RAM 16GB";          description = "DDR5 3200 MHz dual-channel kit";     price = 79.99;   quantity = 45  },
    @{ name = "Microphone";        description = "USB condenser studio microphone";    price = 99.99;   quantity = 20  },
    @{ name = "Laptop Bag";        description = "15.6-inch waterproof laptop bag";    price = 39.99;   quantity = 55  },
    @{ name = "External HDD 2TB";  description = "USB 3.0 portable hard drive";       price = 69.99;   quantity = 35  },
    @{ name = "Smart Watch";       description = "Fitness tracker with AMOLED display";price = 199.99;  quantity = 18  },
    @{ name = "Ethernet Cable";    description = "Cat-8 10Gbps flat cable 2m";        price = 12.99;   quantity = 200 },
    @{ name = "Power Bank";        description = "20000 mAh fast-charge power bank";  price = 44.99;   quantity = 65  },
    @{ name = "Tablet";            description = "10-inch Android tablet 128GB";       price = 329.99;  quantity = 22  },
    @{ name = "Printer";           description = "Wireless colour inkjet printer";     price = 159.99;  quantity = 12  },
    @{ name = "VR Headset";        description = "Standalone VR headset"; price = 499.99; quantity = 0  },
    @{ name = "CPU Cooler";        description = "240mm AIO liquid cooler last units"; price = 89.99;  quantity = 3  }
)

# ---------------------------------------------------------------------------
# Step 3 — Insert products
# ---------------------------------------------------------------------------
$headers = @{ Authorization = "Bearer $ADMIN_TOKEN" }
$uri     = "$GatewayBase/api/products"
$success = 0
$failed  = 0

foreach ($p in $products) {
    $body = $p | ConvertTo-Json
    try {

        $response = Invoke-RestMethod -Method Post -Uri $uri -Headers $headers -ContentType "application/json" -Body $body


        if ($null -ne $response -and $response.id) {
            Write-Host "  [OK] $($p.name) — id: $($response.id)" -ForegroundColor Green
        } else {
            Write-Host "  [OK] $($p.name) — (Inserted successfully, no ID returned)" -ForegroundColor Green
        }
        $success++
    } catch {

        if ($null -ne $_.Exception.Response -and ($_.Exception.Response.StatusCode -match "Created|OK")) {
            Write-Host "  [OK] $($p.name) — Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Green
            $success++
        } else {

            Write-Host "  [FAIL] $($p.name) — $($_.Exception.Message)" -ForegroundColor Red
            $failed++
        }
    }
}

Write-Host ""
Write-Host "Done. $success inserted, $failed failed." -ForegroundColor Cyan
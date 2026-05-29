# Micro-frontends and Module Federation

Objectives:
- Add micro-frontends to the project using Webpack Module Federation (via Vite plugin).
- Containerize the frontend modules and integrate them into `docker-compose.yml`.
- Implement the **SAGA** pattern for distributed transactions across services: cart-api-app, product-api-app, discount-service, and product-service.

---

## Setup Instructions

Run `docker-compose up --build` to start all services.

Run `./seed-products.sh` to populate the product database with sample data.

http://localhost:3000/  Use `testuser` and `password`  to log in via Keycloak and access the app.


#### Local development and code changes:
Run `npm install` in each frontend module (host, product, promo).
Run `docker-compose build host product-ui promo-ui` to build the frontend images.
Run `docker-compose up host product-ui promo-ui -d` to start the frontend containers.

## Micro-frontend

A **micro-frontend** extends the microservice philosophy to the frontend layer.
Instead of a single monolithic UI bundle, the application is split into smaller,
**independently developed, built, and deployed** frontend modules.

### Comparison

| Aspect | Monolithic Frontend | Microfrontend                   |
|---|---|---------------------------------|
| Codebase | One large repository | One repo (or many) per domain   |
| Build | Single build pipeline | Independent build per module    |
| Deploy | Full redeploy for any change | Deploy only the changed module  |
| Team ownership | Shared / coordinated | Per-domain team ownership       |
| Runtime | Single bundle loaded by browser | **Modules composed at runtime** |

### Benefits

- Parallel team delivery with reduced coupling
- Smaller, focused codebases per domain
- Independent release cycles
- Incremental technology upgrades

### Trade-offs

| Challenge | Mitigation | Practical Example |
|---|---|---|
| Shared dependency management | Module Federation `shared` config | Host and `productUI` remote both use React 19 — without `shared`, the browser would download React twice, causing hook errors |
| UX consistency across modules | Shared design system / CSS tokens | A button styled in `host` looks different in `productUI` unless both import the same CSS variables or component library |
| Operational overhead | More services to build, run, and monitor | Adding a new remote means a new `Dockerfile`, a new `docker-compose` service, and a new Kubernetes `Deployment` + `Service` |
| Cross-module communication | Event bus or shared state contract | `productUI` needs to notify `host` that the cart changed — done via a shared `EventBus.js` rather than direct imports |

---

## What is Module Federation?

**Module Federation** is a feature of **Webpack 5** (and supported via
`@originjs/vite-plugin-federation` for Vite) that lets one JavaScript
application **dynamically load code from another independently deployed
application at runtime**.

### Core Concepts

```
Host Application
  └── loads at runtime ──► Remote Application
                                └── exposes Components / Modules
```

| Role | Responsibility |
|---|---|
| **Host** | Shell / container app. Declares which remotes to consume. |
| **Remote** | Exposes one or more components or utilities via a manifest file (`remoteEntry.js`). |
| **Shared dependency** | Library shared between host and remotes (e.g. React) to avoid duplicate loading and version conflicts. |
| **remoteEntry.js** | Auto-generated manifest produced by the remote build. The host fetches this file at runtime to discover what the remote exposes. |

### Lifecycle

```
1. Browser loads Host app bundle
2. Host app needs a federated component (e.g. <ProductList />)
3. Host fetches remoteEntry.js from the Remote URL
4. Shared dependencies (React, react-dom) are negotiated — only one copy loaded
5. Remote component code is downloaded on demand
6. Component renders inside the Host app
```
### Event-bus communication

Since Host and Remote are decoupled, they cannot directly import each other's code.
A **shared `EventBus.js`** file acts as a lightweight message broker between them.

**The Scenario:**
A user is on the product page, rendered by the `productUI` remote.
The product price with the applied discount is fetched from `discount-service` via `product-api`.
The discount badge shown in the page header is owned and rendered by the Host.

**The Solution:**
Rather than `productUI` reaching into the Host's internal code,
it simply fires a message on the shared Event Bus when the discount data arrives:

```js
// inside productUI remote — after discount is fetched
EventBus.emit('DISCOUNT_LOADED', { productId, percentage, description });
```

**The Result:**
The Host listens to the Event Bus independently of the Remote.
When it hears the `DISCOUNT_LOADED` event, it reads the payload and
updates the discount badge in the header — without any direct coupling
between the two modules.

```js
// inside Host — registered once on mount
EventBus.on('DISCOUNT_LOADED', ({ productId, percentage, description }) => {
    setDiscountBadge(`${percentage}% off — ${description}`);
});
```

> This pattern keeps each module's internal state private while still
> enabling meaningful cross-module communication.

> **⚠️ Remote-to-Remote imports are not allowed.**
> Remotes cannot import from other remotes at build time — only the Host orchestrates between remotes.
> For example, `productUI` does **not** import `promoUI/DiscountBadge` directly.
> Instead, discount data is fetched via the API and rendered inline within `productUI`.
> `promoUI` components are composed by the Host shell only.

### Shared dependencies

When both the Host and a Remote use the same library (e.g. React), Module Federation
can be configured to **load it only once** — avoiding version conflicts and duplicate
bundle weight in the browser.

This is controlled by the `shared` key in each app's `vite.config.js`.
Both the Host and the Remote must declare the same libraries as shared,
otherwise the federation runtime will fall back to loading separate copies.

In this project, four libraries are shared across `host` and `remote`:

| Library | Why it must be shared |
|---|---|
| `react` | Only one React instance may exist in the page — two copies cause hook errors |
| `react-dom` | Tightly coupled to `react`; same constraint applies |
| `react-router-dom` | Router context must be a singleton to keep navigation consistent |
| `@tanstack/react-query` | Query cache is global — two instances would result in duplicated requests and stale data |

Both apps declare the same `shared` block in their `vite.config.js`:

```js
shared: {
  react:                   { requiredVersion: '^19.2.0' },
  'react-dom':             { requiredVersion: '^19.2.0' },
  'react-router-dom':      { requiredVersion: '^7.13.0' },
  '@tanstack/react-query': { requiredVersion: '^5.90.20' },
}
```

**How it works at runtime:**

```
1. Host bundle loads — React 19 is registered in the federation shared scope
2. Remote remoteEntry.js is fetched
3. Federation runtime checks: "does the shared scope already have a compatible React?"
4. Yes → Remote reuses the Host's React instance — no second download
5. No compatible version found → Remote loads its own copy (version mismatch fallback)
```

> `requiredVersion` acts as a compatibility guard. If the Remote requires
> `^19.2.0` but the Host only provides `18.x`, the runtime will load a
> separate copy for the Remote rather than cause a runtime error.

---

## Saga Pattern Implementation


#### Flow

```
[CartPage - Host]
    │
    └──> POST http://localhost:8081/api/cart/checkout
              Authorization: Bearer <jwt>
              Body: { items: [{ productId, productName, quantity, unitPrice }] }
              │
              └──> CheckoutSaga (cart-api-app)
                        │
                        ├── Step 3: PATCH /api/products/{id}/stock  (product-api)
                        ├── Step 4: award buyback points             (local)
                        └── Step 5: confirm order                   (local)
```


### Problem Statement

SAGA pattern solves the problem of maintaining data consistency across multiple services 
in a distributed system where each service has its own database. 

It allows us to manage long-running transactions and ensure that all services involved in a transaction either complete successfully or roll back to a consistent state in case of failure.

For example in an e-commerce application a service responsible for processing orders 
interact with a service responsible for managing inventory. 
If the order processing service successfully creates an order but the inventory service fails to update the stock, we need a way to ensure that the system remains in a consistent state.
Since each service manages its own database, we cannot rely on traditional ACID transactions to maintain consistency across services. 
Instead, we can use the SAGA pattern to coordinate the sequence of operations across services and handle failures gracefully.

### Pattern Overview

**Transaction** A SAGA is a sequence of local transactions. Each local transaction updates data within a single service.

**Events** The next transaction in the sequence is triggered by an event or message published by the previous transaction.

**Compensations** When a transaction fails, the SAGA pattern allows us to define compensating transactions that can undo the effects of the previous transactions, ensuring that the system remains in a consistent state.

**Choreography-based SAGA**: In this approach, each service is responsible for publishing events and reacting to events from other services. There is no central coordinator, and the services communicate directly with each other.

**Orchestration-based SAGA**: In this approach, a central coordinator (or orchestrator) is responsible for managing the sequence of transactions and handling failures. The services communicate with the orchestrator, which coordinates the execution of the transactions.


The `CheckoutSaga` component in `cart-api-app` acts as the orchestrator for the checkout flow. It executes five sequential steps: validate the cart, persist the order as `PENDING`, decrement stock via `product-api`, award buyback points, and confirm the order as `CONFIRMED`. Each remote step is guarded by a compensation block — if stock update fails, already-decremented quantities are restored; if point awarding fails, stock is also restored; if the final confirmation fails, points are deducted and stock is restored, leaving the system in a consistent state.

`@Transactional` is required on the `execute` method so that all local database writes (order creation, point updates, status transitions) are committed atomically within a single JPA transaction. This ensures that any unchecked exception bubbling out of the method causes Spring to roll back all local DB changes automatically. The explicit compensation blocks then handle the rollback of remote stock updates, which fall outside the JPA transaction boundary and cannot be undone by the transaction manager alone.



## Project Structure and Implementation Details

### Architecture Overview

```
Browser
└── Host (port 3000)
      │
      ├── loads at runtime ──► product remote (port 3001)
      │                             └── exposes: ProductList, ProductDetail
      │
      └── loads at runtime ──► promo remote (port 3002)
                                    └── exposes: PromoBanner, DiscountBadge

Host ◄──── EventBus ────► product remote
     ◄──── EventBus ────► promo remote
```

| Module | Port | Exposed components |
|---|---|---|
| Host | 3000 | Shell, routing, cart, discount badge in header |
| product remote | 3001 | `ProductList`, `ProductDetail` |
| promo remote | 3002 | `PromoBanner`, `DiscountBadge` |

### Backend communication

`cart-api-app` and `product-api-app` both have a RestClient class that abstracts away the details of making HTTP requests to other services: discount-service and product-service, respectively.

`ClientHttpRequestInterceptor` is used to add the JWT token to the Authorization header of each request, ensuring that the requests are authenticated and authorized properly.

```
cart-api-app
  └── RestClient (+ JWT interceptor)
        └──► product-api-app   PATCH /api/products/{id}/stock

product-api-app
  └── RestClient (+ JWT interceptor)
        └──► discount-service  GET /api/discounts/{productId}
```

### Frontend build and deployment

Each frontend module (host, product, promo) uses a **two-stage Docker build** to produce a minimal, stateless production image.

#### Stage 1 — builder

```dockerfile
FROM node:22-alpine AS builder
```

Node.js is only needed at build time. 
The Vite build compiles and bundles the React app into static files under `dist/`. 
Remote URLs (`VITE_REMOTE_PRODUCT_UI`, `VITE_REMOTE_PROMO_UI`) are passed as `ARG`/`ENV` during the build — Vite embeds them into the bundle at compile time.

#### Stage 2 — nginx

```dockerfile
FROM nginx:alpine
COPY --from=builder /app/dist        /usr/share/nginx/html
COPY host/nginx.conf                  /etc/nginx/conf.d/default.conf
COPY host/entrypoint.sh               /entrypoint.sh
```

**nginx** is a lightweight, high-performance HTTP server purpose-built for serving static files efficiently.

| Line | Purpose |
|---|---|
| `FROM nginx:alpine` | Minimal production base — only what is needed to serve static files |
| `COPY --from=builder /app/dist` | Copies only the compiled output; the Node.js layer is discarded |
| `COPY host/nginx.conf` | Custom server config: SPA fallback, aggressive caching for hashed assets, and `no-cache` for `remoteEntry.js` and `env-config.js` |
| `COPY host/entrypoint.sh` | Shell script that writes runtime env vars into `window.__ENV__` before nginx starts |

#### nginx.conf — caching strategy

The config applies three distinct caching policies:

```
env-config.js        → no-store  (runtime config, must always be fresh)
remoteEntry.js       → no-store  (Module Federation manifest, fetched fresh on every load)
*.js / *.css / *.png → 1y + immutable  (content-hashed filenames, safe to cache forever)
/any/spa/route       → try_files … /index.html  (React Router fallback)
```

`remoteEntry.js` must never be cached because it is the contract between the Host and each remote. If a remote is redeployed, the Host must fetch the new manifest immediately — a stale cached copy would cause the Host to try to load modules that no longer exist at the expected URL.

#### entrypoint.sh — runtime configuration injection

```sh
cat <<EOF > /usr/share/nginx/html/env-config.js
window.__ENV__ = {
  PRODUCT_API_URL:   "${PRODUCT_API_URL}",
  REMOTE_PRODUCT_UI: "${REMOTE_PRODUCT_UI}",
  REMOTE_PROMO_UI:   "${REMOTE_PROMO_UI}",
  ...
};
EOF
exec nginx -g "daemon off;"
```

Because Vite bakes env vars into the bundle at build time, the remote URLs would be hardcoded into the image — breaking multi-environment deployments. 
The entrypoint script solves this by generating `env-config.js` from the container's runtime environment variables each time the container starts, before nginx serves any traffic. 
This follows the [12-factor app](https://12factor.net/config) principle: **one image, many environments**.

The browser loads `env-config.js` before any module federation code runs, so `window.__ENV__.REMOTE_PRODUCT_UI` is always available when the Host needs to fetch `remoteEntry.js` from the product remote.

#### AKS migration

The design choices above map directly onto Kubernetes primitives:

| Design choice | AKS equivalent |
|---|---|
| Stateless container, config via env vars | `env` in Pod spec, sourced from `ConfigMap` or `Secret` |
| `nginx:alpine` tiny image | Fast pull from **Azure Container Registry (ACR)**; lower node disk pressure |
| One image per frontend module | Separate `Deployment` + `Service` per module; independent rollout and scaling |
| `entrypoint.sh` rewrites remote URLs at start | Remote URLs set to internal **Kubernetes Service DNS** names (e.g. `http://product-ui-svc`) in staging, to public Ingress hostnames in prod |
| `Cache-Control: immutable` for hashed assets | Transparent integration with **Azure CDN / Front Door** — CDN can cache assets at edge without stale-content risk |
| HTTP health via nginx root | Standard Kubernetes `livenessProbe` / `readinessProbe` (`httpGet /`) requires no extra code |

In practice the migration path is: push images to ACR → write one `Deployment` + `ClusterIP Service` per frontend → expose the host via an **Ingress** (AGIC or nginx-ingress) → move remote URL env vars into a `ConfigMap` applied per environment. No application code changes are required.

---

## Service Port Reference
| Service | Port |
|---|------|
| API Gateway | 8081 |
| product-api-app | 8082 |
| discount-service | 8083 |
| cart-api-app | 8084 |
| Keycloak | 8080 |
---
## Database Reference

Database schemas for the two main services are initialized via mysql scripts in the `db-init/` directory 
containing `mysql/init.sql` file.

| Service | Schema       |
|---|--------------|
| product-api-app | `product_db` |
| cart-api-app | `cart_db`    |
Both schemas on the same MySQL instance (port 3306).



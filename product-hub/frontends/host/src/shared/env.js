const runtimeEnv = window.__ENV__ || {};

export const env = {
    PRODUCT_API_URL:   runtimeEnv.PRODUCT_API_URL   || import.meta.env.VITE_PRODUCT_API_URL   || 'http://localhost:8081/api',
    REMOTE_PRODUCT_UI: runtimeEnv.REMOTE_PRODUCT_UI || import.meta.env.VITE_REMOTE_PRODUCT_UI || 'http://localhost:3001',
    REMOTE_PROMO_UI:   runtimeEnv.REMOTE_PROMO_UI   || import.meta.env.VITE_REMOTE_PROMO_UI   || 'http://localhost:3002',
    KEYCLOAK_URL:      runtimeEnv.KEYCLOAK_URL       || import.meta.env.VITE_KEYCLOAK_URL      || 'http://localhost:8180',
    APP_URL:           import.meta.env.VITE_APP_URL  || 'http://localhost:3000',
    CART_API_URL:      runtimeEnv.CART_API_URL       || import.meta.env.VITE_CART_API_URL      || 'http://localhost:8081/api',
};


#!/bin/sh
cat <<EOF > /usr/share/nginx/html/env-config.js
window.__ENV__ = {
  PRODUCT_API_URL:    "${PRODUCT_API_URL}",
  REMOTE_PRODUCT_UI:  "${REMOTE_PRODUCT_UI}",
  REMOTE_PROMO_UI:    "${REMOTE_PROMO_UI}",
  KEYCLOAK_URL:       "${KEYCLOAK_URL}",
  APP_URL:            "${APP_URL}",
  CART_API_URL:       "${CART_API_URL}",
};
EOF
exec nginx -g "daemon off;"


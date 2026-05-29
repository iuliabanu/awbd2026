#!/bin/sh
# Inject runtime environment variables into the built HTML before Nginx starts.
cat <<EOF > /usr/share/nginx/html/env-config.js
window.__ENV__ = {
  PRODUCT_API_URL: "${PRODUCT_API_URL}",
  KEYCLOAK_URL:    "${KEYCLOAK_URL}",
};
EOF
exec nginx -g "daemon off;"


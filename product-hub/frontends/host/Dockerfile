FROM node:22-alpine AS builder
WORKDIR /app
COPY event-bus/package*.json ./event-bus/
COPY host/package*.json ./host/
COPY event-bus/ ./event-bus/
WORKDIR /app/host
RUN sed -i 's/\r$//' package.json package-lock.json && npm ci
COPY host/ ./

ARG VITE_REMOTE_PRODUCT_UI=http://localhost:3001
ARG VITE_REMOTE_PROMO_UI=http://localhost:3002
ENV VITE_REMOTE_PRODUCT_UI=${VITE_REMOTE_PRODUCT_UI}
ENV VITE_REMOTE_PROMO_UI=${VITE_REMOTE_PROMO_UI}

RUN npm run build
FROM nginx:alpine
COPY --from=builder /app/host/dist /usr/share/nginx/html
COPY host/nginx.conf /etc/nginx/conf.d/default.conf
COPY host/entrypoint.sh /entrypoint.sh
RUN sed -i 's/\r$//' /entrypoint.sh && chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
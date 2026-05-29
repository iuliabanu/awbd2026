FROM node:22-alpine AS builder
WORKDIR /app
COPY event-bus/package*.json ./event-bus/
COPY product/package*.json ./product/
COPY event-bus/ ./event-bus/
WORKDIR /app/product
RUN sed -i 's/\r$//' package.json package-lock.json && npm ci
COPY product/ .


ARG VITE_REMOTE_PROMO_UI=http://localhost:3002
ENV VITE_REMOTE_PROMO_UI=${VITE_REMOTE_PROMO_UI}
RUN npm run build


FROM nginx:alpine
COPY --from=builder /app/product/dist /usr/share/nginx/html
COPY product/nginx.conf        /etc/nginx/conf.d/default.conf
COPY product/entrypoint.sh     /entrypoint.sh
RUN chmod +x /entrypoint.sh && sed -i 's/\r$//' /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]





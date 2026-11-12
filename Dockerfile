# Stage 1: Build Angular production bundle
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY angular.json tsconfig*.json ./
COPY public ./public
COPY src ./src
RUN npx ng build --configuration=production

# Stage 2: Serve SPA with Nginx + reverse proxy to backend
FROM nginx:1.27-alpine AS runner
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/prototipo_app/browser /usr/share/nginx/html

# Inject runtime API URL when API_BASE_URL is provided (default '/' uses same-origin Nginx proxy)
RUN printf '#!/bin/sh\nset -e\nAPI_VAL="${API_BASE_URL:-/}"\nprintf "window.__PLATO_API_URL__ = %s;\n" "\"$API_VAL\"" > /usr/share/nginx/html/runtime-config.js\n' > /docker-entrypoint.d/40-plato-runtime-config.sh \
  && chmod +x /docker-entrypoint.d/40-plato-runtime-config.sh

EXPOSE 80


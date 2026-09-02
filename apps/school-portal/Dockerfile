# ==========================================
# Stage 1: Build Frontend SPA
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build-time environment arguments (public URLs)
ARG VITE_API_URL
ARG VITE_WS_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL

# Copy monorepo root package manifests
COPY package.json package-lock.json ./
COPY packages ./packages
COPY apps/school-portal ./apps/school-portal

# Install dependencies across monorepo workspace
RUN npm ci

# Build production bundle
RUN npm run build -w @sms/school-portal

# ==========================================
# Stage 2: Nginx Static Serving
# ==========================================
FROM nginx:alpine AS runtime

# Copy custom Nginx SPA configuration
RUN echo 'server {' \
    '    listen 80;' \
    '    server_name localhost;' \
    '    root /usr/share/nginx/html;' \
    '    index index.html;' \
    '    gzip on;' \
    '    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;' \
    '    add_header X-Frame-Options "DENY" always;' \
    '    add_header X-Content-Type-Options "nosniff" always;' \
    '    location / {' \
    '        try_files $uri $uri/ /index.html;' \
    '    }' \
    '    location ~* \.(?:css|js|jpg|jpeg|gif|png|ico|svg|woff|woff2)$ {' \
    '        expires 1y;' \
    '        add_header Cache-Control "public, immutable";' \
    '    }' \
    '}' > /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/apps/school-portal/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

# Stage 1: Development with Dependencies
FROM node:22-slim@sha256:b21fe589dfbe5cc39365d0544b9be3f1f33f55f3c86c87a76ff65a02f8f5848e AS dev

# Install Python, build-essential, and OpenSSL for node-gyp dependencies
RUN apt-get update && \
    apt-get install -y python3 build-essential openssl && \
    ln -s /usr/bin/python3 /usr/bin/python && \
    rm -rf /var/lib/apt/lists/* /var/log/* /var/cache/ldconfig/aux-cache

WORKDIR /app

# Install pnpm with specific version
RUN npm install -g pnpm@10.10.0

# Install all dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Build the application
COPY . .
RUN pnpm run build

# Prune dev dependencies for production (skip prepare script)
RUN pnpm prune --prod --ignore-scripts && \
    rm -f /app/node_modules/.modules.yaml /app/node_modules/.pnpm-workspace-state*.json

# Normalize file permissions
RUN find /app/.prisma -type f -exec chmod 0664 {} + && \
    find /app/.prisma -type d -exec chmod 0775 {} +


# Stage 2: Runtime Lightweight Image
FROM node:22-slim@sha256:b21fe589dfbe5cc39365d0544b9be3f1f33f55f3c86c87a76ff65a02f8f5848e AS runtime

WORKDIR /app
ENV NODE_ENV=production

# Install OpenSSL for runtime
RUN apt-get update && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/* /var/log/* /var/cache/ldconfig/aux-cache

# Set up a non-root user
RUN groupmod -g 1001 node \
    && usermod -u 1001 -g 1001 node

# Copy installed dependencies and built application from the dev stage
COPY --from=dev --chown=node:node /app/node_modules node_modules
COPY --from=dev --chown=node:node /app/dist dist
COPY --from=dev --chown=node:node --chmod=0644 /app/package.json package.json 
COPY --from=dev --chown=node:node /app/.prisma .prisma

USER node
EXPOSE 3000

# Start the application
CMD ["npm", "start"]

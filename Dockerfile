# Stage 1: Development with Dependencies
FROM node:22-slim AS dev

# Install Python, build-essential, and OpenSSL for node-gyp dependencies
RUN apt-get update && \
    apt-get install -y python3 build-essential openssl && \
    ln -s /usr/bin/python3 /usr/bin/python && \
    rm -rf /var/lib/apt/lists/*

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
RUN pnpm prune --prod --ignore-scripts

# Stage 2: Runtime Lightweight Image
FROM node:22-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production

# Install OpenSSL for runtime
RUN apt-get update && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/*

# Set up a non-root user
RUN groupmod -g 1001 node \
    && usermod -u 1001 -g 1001 node

# Copy installed dependencies and built application from the dev stage
COPY --chown=node:node --from=dev /app/node_modules node_modules
COPY --chown=node:node --from=dev /app/dist dist
COPY --chown=node:node --from=dev /app/package.json package.json
COPY --chown=node:node --from=dev /app/.prisma .prisma

USER node
EXPOSE 3000

# Start the application
CMD ["npm", "start"]

FROM mcr.microsoft.com/devcontainers/typescript-node:20

# Required packages for git operations, HTTP tooling, SSL, and native builds
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git \
        curl \
        ca-certificates \
        openssl \
        build-essential \
        python3 \
    && rm -rf /var/lib/apt/lists/*

# Ensure modern package managers are enabled for Node 20 images
RUN corepack enable

WORKDIR /workspace


FROM node:18-bookworm-slim

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy prisma schema for client generation
COPY prisma ./prisma

# Install backend dependencies
COPY backend/package*.json ./
RUN npm ci

# Copy backend source
COPY backend/ .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

CMD ["npm", "start"]

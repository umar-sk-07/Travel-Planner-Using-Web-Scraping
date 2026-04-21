FROM node:18-bookworm-slim

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy prisma schema for client generation
COPY prisma ./prisma

# Install dependencies
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source
COPY frontend/ .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]

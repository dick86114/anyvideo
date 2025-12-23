FROM node:18-alpine as build

WORKDIR /app

# Install dependencies for npm ci
RUN apk add --no-cache git

COPY package*.json ./

# Use npm ci for deterministic builds
RUN npm ci --production

COPY src/ ./src/
COPY .env.example ./

# Log node and npm versions
RUN node --version && npm --version

# Start the server
CMD ["node", "src/server.js"]
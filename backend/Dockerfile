FROM node:18-alpine as build

WORKDIR /app

# Use a non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

COPY package*.json ./

# Install dependencies with production flag
RUN npm install --production

COPY src/ ./src/
COPY .env.example ./
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

# Start the server
CMD ["node", "src/server.js"]
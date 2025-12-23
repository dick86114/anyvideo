FROM node:18-alpine as build

WORKDIR /app

# Install dependencies for npm ci
RUN apk add --no-cache git

COPY package*.json ./

# Use npm ci for deterministic builds
RUN npm ci

COPY . .

# Log node and npm versions
RUN node --version && npm --version

# Run lint first to catch any syntax errors
RUN npm run lint || echo "Lint failed, continuing with build"

# Build with verbose output
RUN npm run build -- --debug --verbose

FROM nginx:alpine as production

# Copy the built assets from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
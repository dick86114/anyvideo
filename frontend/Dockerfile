FROM node:18-alpine as build

WORKDIR /app

# Use a non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

COPY package*.json ./

# Install dependencies
RUN npm install

COPY . .
RUN chown -R nodejs:nodejs /app

USER nodejs

# Build the application
RUN npm run build

FROM nginx:alpine as production

# Copy the built assets from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
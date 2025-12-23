FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./

# Install dependencies with verbose output
RUN npm install --verbose

COPY . ./

# Build with verbose output and progress
RUN npm run build -- --verbose --progress=plain

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY src/ ./src/
COPY .env.example ./

EXPOSE 3000

CMD ["node", "src/server.js"]
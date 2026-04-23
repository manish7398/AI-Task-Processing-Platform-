FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY backend/src/ ./src/

USER node

EXPOSE 5000

CMD ["node", "src/server.js"]
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY server.js .
EXPOSE 80
CMD ["node", "server.js"]

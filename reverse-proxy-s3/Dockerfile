FROM node:20-alpine
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --only=production
COPY server.js .
EXPOSE 80
CMD ["node", "server.js"]

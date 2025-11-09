FROM node:20-alpine
WORKDIR /app

# Set production environment
# ! Making proudction tells Node.js and packages you're in production
# ! Without it, defaults to development mode (slower, more verbose logging)
ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --only=production
COPY . .
EXPOSE 4571
CMD [ "node", "server.js" ]

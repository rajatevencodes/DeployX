# STAGE 1 : Build Stage
FROM node:20-alpine AS build
WORKDIR /app

# Don't set NODE_ENV=production here - we need devDependencies (vite) for building
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# STAGE 2 : Final Stage
FROM node:20-alpine
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Install simple web server globally - serve (popular npm tool for serving static files)
RUN npm install -g serve
COPY --from=build /app/dist .
EXPOSE 3000
# '-s' is single-page application , current directory is the root of the static files to serve, and '-l 3000' listens on port 3000.
CMD ["serve", "-s", ".", "-l", "3000"]

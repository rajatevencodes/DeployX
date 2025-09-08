# STAGE 1 : Build Stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# STAGE 2 : Final Stage
FROM node:20-alpine
WORKDIR /app
# Install simple web server globally - serve (popular npm tool for serving static files)
RUN npm install -g serve
COPY --from=build /app/dist .
EXPOSE 3000
# '-s' is single-page application , current directory is the root of the static files to serve, and '-l 3000' listens on port 3000.
CMD ["serve", "-s", ".", "-l", "3000"]

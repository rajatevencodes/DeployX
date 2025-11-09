# STAGE 1 : Build Stage
FROM node:20-alpine AS build
WORKDIR /app

# Accept build arguments for Vite environment variables
ARG VITE_API_URL
ARG VITE_SOCKET_URL
ARG VITE_CURRENT_DOMAIN

# Set as environment variables for Vite build
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_SOCKET_URL=${VITE_SOCKET_URL}
ENV VITE_CURRENT_DOMAIN=${VITE_CURRENT_DOMAIN}

# Debug: Print environment variables to verify they're set
RUN echo "🔍 Build Args: VITE_API_URL=${VITE_API_URL}, VITE_SOCKET_URL=${VITE_SOCKET_URL}, VITE_CURRENT_DOMAIN=${VITE_CURRENT_DOMAIN}"

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

# Use the official, modern, and slim Node.js image
FROM node:20-slim

# Set the working directory for your application
WORKDIR /home/app

# Install git and certificates. This also fixes the Git SSL error.
RUN apt-get update && apt-get install -y ca-certificates git --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Copy your package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your application files (script.js, main.sh, etc.)
COPY . .

# Make your shell script executable
RUN chmod +x main.sh

# Set the script to run when the container starts
ENTRYPOINT [ "/home/app/main.sh" ]
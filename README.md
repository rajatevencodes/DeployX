# DeployX 🚀

A self-hosted Vercel clone that automates building and deploying web applications to your AWS infrastructure. It provides real-time build logs and instant access to deployed sites.

## 🏗️ Architecture

![Architecture Diagram](https://ik.imagekit.io/5wegcvcxp/Resume-Deployx/Architecture.png?updatedAt=1757291326020)

## 🎥 Demo Video

[![DeployX Demo](https://ik.imagekit.io/5wegcvcxp/Resume-Deployx/Resume-deployx.png?updatedAt=1757291325420)](https://photos.app.goo.gl/WnhL8X7Aokq6MYix7)

- **Frontend**: A Vite-based React application for the user interface.
- **Main Backend**: An Express.js server with Socket.IO for managing deployments.
- **Build Server**: A containerized environment that clones, builds, and uploads applications to S3.
- **Reverse Proxy**: An HTTP proxy that routes requests to the correct S3 bucket based on the subdomain.

## ✨ Features

- **One-Click Deployment**: Deploy any Git repository with a single click
- **Real-time Build Logs**: Live-streamed deployment progress and status updates
- **AWS Integration**: Uses AWS ECR, ECS, S3, and other services for scalable deployments
- **Custom Subdomains**: Each project gets a unique subdomain for easy access
- **Self-hosted**: Full control over your deployment platform

## 🚀 Quick Setup

**Prerequisites:** Register your image on AWS ECR. See the [AWS ECR Setup Guide](https://github.com/rajatevencodes/DeployX/blob/main/AWS-ECR-IMAGE/README.md) for detailed instructions.

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   ```

2. **Create environment file**

   ```bash
   cp .env.local .env
   ```

3. **Configure your `.env` file** with your AWS credentials

4. **Start all services**

   ```bash
   docker-compose up --build
   ```

5. **Access the application** at `http://localhost:3000`

## 📖 Usage

1. Open the DeployX frontend
2. Enter your Git repository URL and project name
3. Click "Deploy"
4. Access your deployed site at `https://<project-name>.<your-domain>.com` or `http://<project-name>.localhost.com`

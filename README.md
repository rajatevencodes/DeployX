# DeployX 🚀

A self-hosted Vercel clone that automates building and deploying web applications to your AWS infrastructure. It provides real-time build logs and instant access to deployed sites.

## 🎥 Demo Video

[![DeployX Demo](https://ik.imagekit.io/5wegcvcxp/Resume-Deployx/Resume-deployx.png?updatedAt=1757291325420)](https://photos.app.goo.gl/WnhL8X7Aokq6MYix7)

## 🏗️ Architecture

![Architecture Diagram](https://ik.imagekit.io/5wegcvcxp/Resume-Deployx/Architecture.png?updatedAt=1757291326020)

- **Frontend**: A Vite-based React application for the user interface.
- **Main Backend**: An Express.js server with Socket.IO for managing deployments.
- **Build Server**: A containerized environment that clones, builds, and uploads applications to S3.
- **Reverse Proxy**: An HTTP proxy that routes requests to the correct S3 bucket based on the subdomain.

### 🚀 Quick Setup

**Before starting:** Make sure to register your image on AWS ECR. Reference the README file in the AWS-ECR-IMAGE/codebase-build-server folder.

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    ```
2.  **Create an environment file**
    ```bash
    cp .env.local .env
    ```
3.  **Configure your `.env` file** with your credentials.
4.  **Start all services**
    ```bash
    docker-compose up --build
    ```
5.  **Access the application** at `http://localhost:3000`.

# Codebase Build Server

A containerized build server that clones Git repositories, builds applications, and deploys them to AWS S3. This service is part of the DeployX platform - a Vercel clone for self-hosted deployments.

## 📚 Documentation References

### AWS S3 Static Website Hosting

- [Hosting Static Website via S3 Bucket](https://kshitijaa.hashnode.dev/hosting-a-static-website-using-an-aws-s3-bucket-a-simple-guide)

### AWS ECR and ECS

- [Introduction to AWS ECS and ECR Services](https://amitabhdevops.hashnode.dev/a-beginners-overview-of-aws-ecs-and-ecr-services)
- [Deploying Node.js App on AWS ECS Fargate and ECR](https://dhananjaykulkarni.hashnode.dev/project-6-deploying-a-nodejs-app-on-aws-ecs-fargate-and-ecr-step-by-step-guide)

## 🚀 Local Development

### Prerequisites

- Docker and Docker Compose
- AWS credentials configured
- Valkey/Redis instance (Aiven recommended)

### Method 1: Docker Build

1. **Build the Docker image**

   ```bash
   docker build -t codebase-builds-img .
   ```

2. **Set up environment variables**

   ```bash
   cp env.example .env
   # Edit .env file with your actual values
   ```

3. **Run the container**
   ```bash
   docker run -it \
     --env-file .env \
     codebase-builds-img
   ```

### Method 2: Docker Compose (Recommended)

```bash
# Use --build to force Docker to remove cache and rebuild
docker-compose up --build
```

## 🔧 Environment Variables

Required environment variables:

```env
PROJECT_ID=your-project-name
USER_GIT_REPOSITORY_URL=https://github.com/username/repo.git
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=your-bucket-name
VALKEY_AIVEN_URI=redis://username:password@host:port
```

## 📦 Deployment to AWS ECR

**Important:** After making code changes, always push the updated image to ECR:

```bash
# Tag the image
docker tag codebase-builds-img:latest your-account.dkr.ecr.region.amazonaws.com/codebase-builds-img:latest

# Push to ECR
docker push your-account.dkr.ecr.region.amazonaws.com/codebase-builds-img:latest
```

## 🏗️ How It Works

1. **Clone Repository**: Downloads the specified Git repository
2. **Install Dependencies**: Runs `npm install` in the cloned directory
3. **Build Application**: Executes `npm run build` to create production build
4. **Upload to S3**: Uploads the `dist` folder contents to AWS S3
5. **Publish Logs**: Streams build progress via Valkey/Redis

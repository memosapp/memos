# Google Cloud Run Deployment Guide

This guide explains how to deploy the backend and MCP services to Google Cloud Run using the production-ready Dockerfiles.

## Prerequisites

1. Google Cloud CLI installed and authenticated
2. Docker installed locally
3. Google Cloud project with Cloud Run API enabled
4. Billing enabled on your Google Cloud project

## Services Overview

### Backend Service (`apps/backend/`)

- **Port**: Uses `PORT` environment variable (Cloud Run compatible)
- **Health Check**: Available at `/health` endpoint
- **Build Output**: TypeScript compiled to `dist/` directory
- **Production Features**: Multi-stage build, non-root user, optimized for security

### MCP Service (`apps/mcp/`)

- **Port**: Uses `PORT` environment variable (Cloud Run compatible)
- **Build Output**: TypeScript compiled to `build/` directory
- **Production Features**: Multi-stage build, non-root user, optimized for security

## Deployment Commands

### Backend Service

```bash
# Navigate to backend directory
cd apps/backend

# Build and tag the Docker image
docker build -t gcr.io/YOUR_PROJECT_ID/memos-backend:latest .

# Push to Google Container Registry
docker push gcr.io/YOUR_PROJECT_ID/memos-backend:latest

# Deploy to Cloud Run
gcloud run deploy memos-backend \
  --image gcr.io/YOUR_PROJECT_ID/memos-backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --max-instances 10 \
  --memory 1Gi \
  --cpu 1 \
  --port 8080 \
  --set-env-vars="NODE_ENV=production"
```

### MCP Service

```bash
# Navigate to MCP directory
cd apps/mcp

# Build and tag the Docker image
docker build -t gcr.io/YOUR_PROJECT_ID/memos-mcp:latest .

# Push to Google Container Registry
docker push gcr.io/YOUR_PROJECT_ID/memos-mcp:latest

# Deploy to Cloud Run
gcloud run deploy memos-mcp \
  --image gcr.io/YOUR_PROJECT_ID/memos-mcp:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --max-instances 5 \
  --memory 512Mi \
  --cpu 1 \
  --port 8080 \
  --set-env-vars="NODE_ENV=production"
```

## Environment Variables

Make sure to set the required environment variables for each service:

### Backend Service

```bash
gcloud run services update memos-backend \
  --set-env-vars="SUPABASE_URL=your_supabase_url,SUPABASE_ANON_KEY=your_anon_key,SUPABASE_SERVICE_ROLE_KEY=your_service_key,GEMINI_API_KEY=your_gemini_key"
```

### MCP Service

```bash
gcloud run services update memos-mcp \
  --set-env-vars="BACKEND_URL=https://your-backend-service-url,OTHER_ENV_VARS=values"
```

## Docker Features

### Security Features

- ✅ Non-root user (nodejs:nodejs with UID 1001)
- ✅ Multi-stage builds to reduce image size
- ✅ Optimized .dockerignore files
- ✅ dumb-init for proper signal handling

### Cloud Run Optimizations

- ✅ PORT environment variable support
- ✅ Health check endpoints
- ✅ Proper signal handling for graceful shutdowns
- ✅ Node.js 20 Alpine Linux base for performance and security
- ✅ Production dependency optimization

### Build Optimizations

- ✅ Cached dependency layers
- ✅ TypeScript compilation in builder stage
- ✅ Only production dependencies in final image
- ✅ npm cache cleanup for smaller images

## Monitoring and Logs

View logs for your deployed services:

```bash
# Backend logs
gcloud run services logs read memos-backend --limit=50

# MCP logs
gcloud run services logs read memos-mcp --limit=50
```

## Scaling Configuration

Cloud Run will automatically scale based on traffic. You can adjust the scaling parameters:

```bash
# Update scaling settings
gcloud run services update memos-backend \
  --min-instances 0 \
  --max-instances 10 \
  --concurrency 80

gcloud run services update memos-mcp \
  --min-instances 0 \
  --max-instances 5 \
  --concurrency 80
```

## Cost Optimization

- Services scale to zero when not in use
- Use appropriate CPU and memory allocations
- Consider regional deployment for lower latency
- Monitor usage with Cloud Monitoring

## Troubleshooting

### Common Issues

1. **Build Failures**: Check that all required files are included and not in .dockerignore
2. **Port Issues**: Ensure services listen on `process.env.PORT`
3. **Environment Variables**: Verify all required env vars are set
4. **Health Checks**: Ensure `/health` endpoints are working

### Debug Commands

```bash
# Test image locally
docker run -p 8080:8080 -e PORT=8080 gcr.io/YOUR_PROJECT_ID/memos-backend:latest

# Check Cloud Run service details
gcloud run services describe memos-backend --region us-central1
```

Replace `YOUR_PROJECT_ID` with your actual Google Cloud project ID throughout this guide.

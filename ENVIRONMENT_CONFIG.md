# Environment Configuration Guide

This document explains how to configure the backend and MCP services for different environments (development vs production).

## Environment Variables

### Core Configuration

| Variable   | Development Default | Production Default           | Description         |
| ---------- | ------------------- | ---------------------------- | ------------------- |
| `NODE_ENV` | `development`       | `production`                 | Environment mode    |
| `HOST`     | `0.0.0.0`           | `0.0.0.0`                    | Server bind address |
| `PORT`     | `8080`              | Backend: `3001`, MCP: `3002` | Server port         |

### Backend Service Environment Variables

```bash
# Development
NODE_ENV=development
HOST=0.0.0.0
PORT=8080

# Production (defaults)
NODE_ENV=production
HOST=0.0.0.0
PORT=3001  # or process.env.PORT for Cloud Run
```

### MCP Service Environment Variables

```bash
# Development
NODE_ENV=development
HOST=0.0.0.0
PORT=8080

# Production (defaults)
NODE_ENV=production
HOST=0.0.0.0
PORT=3002  # or process.env.PORT for Cloud Run
```

## Running Services

### Development Mode

```bash
# Backend
cd apps/backend
NODE_ENV=development pnpm dev

# MCP
cd apps/mcp
NODE_ENV=development pnpm dev
```

### Production Mode

```bash
# Backend
cd apps/backend
NODE_ENV=production pnpm start

# MCP
cd apps/mcp
NODE_ENV=production pnpm start
```

## Docker Configuration

### Development Docker Compose

The existing `docker-compose.yml` is configured for development:

```yaml
services:
  backend:
    ports:
      - "3001:8080" # External:Internal
    environment:
      - NODE_ENV=development
      - HOST=0.0.0.0
    # No PORT override - uses environment logic (8080)

  mcp:
    ports:
      - "3002:8080" # External:Internal
    environment:
      - NODE_ENV=development
      - HOST=0.0.0.0
    # No PORT override - uses environment logic (8080)
```

**Port Mapping**: Services run on port 8080 inside containers (development mode) but are accessible externally on their traditional ports (3001, 3002) for backwards compatibility.

### Production Docker

The production Dockerfiles already handle environment configuration. Cloud Run will automatically set the `PORT` environment variable.

## Environment Detection

Both services automatically detect the environment and configure themselves accordingly:

```javascript
const NODE_ENV = process.env.NODE_ENV || "production";
const isDevelopment = NODE_ENV === "development";

// Port configuration
const PORT = parseInt(
  process.env.PORT || (isDevelopment ? "8080" : "3001"),
  10
);

// Host configuration
const HOST = process.env.HOST || (isDevelopment ? "0.0.0.0" : "0.0.0.0");
```

## Console Output

When starting, each service will log its configuration:

```
Environment: development
Host: 0.0.0.0
Port: 8080
Backend server running on http://0.0.0.0:8080 (development)
```

## Google Cloud Run

For Cloud Run deployment, the services will automatically use the `PORT` environment variable provided by the platform while maintaining production defaults for other settings.

## Troubleshooting

### Common Issues

1. **Port Conflicts**: Ensure no other services are running on the specified ports
2. **Environment Variables**: Check that `NODE_ENV` is set correctly
3. **Host Binding**: Use `0.0.0.0` for Docker containers to allow external connections

### Debugging

Enable debug logging by checking the console output during startup. The services will display their configuration including environment, host, and port.

### Testing Configuration

You can test the configuration by making HTTP requests:

```bash
# Development
curl http://localhost:8080/health

# Production (default ports)
curl http://localhost:3001/health  # Backend
curl http://localhost:3002/health  # MCP
```

# Port Configuration Summary

## 🚀 Service Ports

All services are configured to run on the following ports:

| Service    | Host Port | Container Port | URL                   |
| ---------- | --------- | -------------- | --------------------- |
| Frontend   | 3000      | 3000           | http://localhost:3000 |
| Backend    | 3001      | 3001           | http://localhost:3001 |
| MCP Server | 3002      | 3002           | http://localhost:3002 |
| Database   | 5432      | 5432           | localhost:5432        |

## 🔧 Configuration Details

### Frontend (Next.js)

- **Container**: Runs on port 3000 (Next.js default)
- **Host Mapping**: 3000:3000 in docker-compose.yml
- **Access**: http://localhost:3000

### Backend (Express)

- **Container**: Runs on port 3001 (configured via PORT env var)
- **Host Mapping**: 3001:3001 in docker-compose.yml
- **Access**: http://localhost:3001

### MCP Server (Express)

- **Container**: Runs on port 3002 (configured in index.ts)
- **Host Mapping**: 3002:3002 in docker-compose.yml
- **Access**: http://localhost:3002

### Database (PostgreSQL)

- **Container**: Runs on port 5432 (PostgreSQL default)
- **Host Mapping**: 5432:5432 in docker-compose.yml
- **Access**: localhost:5432

## 🌐 Inter-Service Communication

### Within Docker Network

Services communicate using Docker service names:

- MCP → Backend: `http://backend:3001`
- Frontend → Backend: Uses `NEXT_PUBLIC_API_URL=http://localhost:3001`

### From Host Machine

All services are accessible from the host machine:

- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- MCP: http://localhost:3002
- Database: localhost:5432

## 🔍 Verification

Run the port verification script:

```bash
./verify-ports.sh
```

This script will:

- Check if each service is accessible on its expected port
- Verify database connectivity
- Show Docker container status
- Provide troubleshooting suggestions

## 🔄 Environment Variables

### Backend Service

```bash
PORT=3001                    # Server port
DB_HOST=postgres            # Database host (service name)
DB_PORT=5432               # Database port
```

### Frontend Service

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001  # Backend API URL for browser
```

### MCP Service

```bash
BACKEND_API_URL=http://backend:3001        # Backend API URL for server-side calls
```

## 🚨 Troubleshooting

### Port Conflicts

If you encounter port conflicts:

1. Check what's using the ports: `lsof -i :3000 :3001 :3002 :5432`
2. Stop conflicting services
3. Restart Docker Compose: `./start-dev.sh`

### Service Not Accessible

1. Check container status: `docker-compose ps`
2. Check logs: `docker-compose logs [service-name]`
3. Verify port mapping in docker-compose.yml
4. Run verification script: `./verify-ports.sh`

### Database Connection Issues

1. Wait for database health check to pass
2. Check database logs: `docker-compose logs postgres`
3. Verify connection: `docker-compose exec postgres pg_isready -U memos_user -d memos`

## 📝 Notes

- All services support hot reload for development
- Port mappings are defined in docker-compose.yml
- Environment variables are configured per service
- Services use Docker network for internal communication
- Host machine accesses services via mapped ports

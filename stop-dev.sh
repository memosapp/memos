#!/bin/bash

# Stop Development Environment
echo "🛑 Stopping Memos Development Environment..."

# Stop all services
docker-compose down

echo "✅ All services stopped."
echo "☁️  Your Supabase data is safely stored in the cloud"
echo "🗑️  To remove local Docker images: docker-compose down --rmi all" 
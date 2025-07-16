#!/bin/bash

# Stop Development Environment
echo "🛑 Stopping Memos Development Environment..."

# Stop all services
docker-compose down

echo "✅ All services stopped."
echo "💾 Database data is preserved in docker volume 'postgres_data'"
echo "🗑️  To remove all data, run: docker-compose down -v" 
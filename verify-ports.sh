#!/bin/bash

# Port Verification Script
echo "🔍 Verifying Memos Services Port Configuration..."
echo ""

# Function to check if a port is accessible
check_port() {
    local port=$1
    local service=$2
    local path=${3:-""}
    
    echo -n "Checking $service on port $port... "
    
    if curl -s -f "http://localhost:$port$path" > /dev/null 2>&1; then
        echo "✅ RUNNING"
    else
        echo "❌ NOT ACCESSIBLE"
        echo "   Try: curl http://localhost:$port$path"
    fi
}

# Check all services
echo "📋 Expected Port Configuration:"
echo "   - Frontend:    http://localhost:3000"
echo "   - Backend API: http://localhost:3001"  
echo "   - MCP Server:  http://localhost:3002"
echo "   - Database:    localhost:5432"
echo ""

echo "🔍 Port Accessibility Check:"
check_port 3000 "Frontend" "/"
check_port 3001 "Backend API" "/health"
check_port 3002 "MCP Server" "/mcp"

echo ""
echo "📊 Database Connection Check:"
if docker-compose exec -T postgres pg_isready -U memos_user -d memos > /dev/null 2>&1; then
    echo "Database on port 5432... ✅ RUNNING"
else
    echo "Database on port 5432... ❌ NOT ACCESSIBLE"
fi

echo ""
echo "🐳 Docker Container Status:"
docker-compose ps

echo ""
echo "📡 If any service is not running, try:"
echo "   ./start-dev.sh"
echo ""
echo "📜 To view logs:"
echo "   docker-compose logs -f [service-name]" 
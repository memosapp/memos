#!/bin/bash

# Start Development Environment
echo "🐳 Starting Memos Development Environment..."
echo "📋 Services will be available at:"
echo "  - Frontend:    http://localhost:3000"
echo "  - Backend API: http://localhost:3001"
echo "  - MCP Server:  http://localhost:3002"
echo "  - Database:    localhost:5432"
echo ""

# Check if .env files exist
if [ ! -f "apps/backend/.env" ]; then
    echo "⚠️  Please create apps/backend/.env file with your Gemini API key"
    echo "   Example:"
    echo "   GEMINI_API_KEY=your_api_key_here"
    echo ""
fi

# Start all services
echo "🚀 Starting all services..."
docker-compose up -d

# Show logs
echo "📜 Showing logs (Ctrl+C to stop)..."
echo "💡 To verify ports are working: ./verify-ports.sh"
echo ""
docker-compose logs -f 
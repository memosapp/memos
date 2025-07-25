#!/bin/bash

# Start Development Environment
echo "🐳 Starting Memos Development Environment..."
echo "📋 Services will be available at:"
echo "  - Frontend:    http://localhost:3000"
echo "  - Backend API: http://localhost:3001 (container: 8080)"
echo "  - MCP Server:  http://localhost:3002 (container: 8080)"
echo "  - Database:    Supabase (cloud hosted)"
echo ""
echo "💡 Note: Services run on port 8080 inside containers (development mode)"
echo ""

# Check if .env files exist
if [ ! -f "apps/backend/.env" ]; then
    echo "⚠️  Please create apps/backend/.env file with your Supabase credentials"
    echo "   Required variables:"
    echo "   SUPABASE_URL=https://your-project.supabase.co"
    echo "   SUPABASE_KEY=your_anon_key_here"
    echo "   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here"
    echo "   GEMINI_API_KEY=your_gemini_api_key_here (optional)"
    echo ""
    echo "💡 See SUPABASE_SETUP.md for detailed setup instructions"
    echo ""
fi

# Start all services
echo "🚀 Starting all services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to start..."
sleep 5

# Quick health check
echo "🔍 Quick health check:"
if curl -s -f "http://localhost:3001/health" > /dev/null 2>&1; then
    echo "✅ Backend is running"
    if curl -s -f "http://localhost:3001/test/connection" > /dev/null 2>&1; then
        echo "✅ Supabase connection working"
    else
        echo "⚠️  Supabase connection issue - check your .env file"
    fi
else
    echo "⚠️  Backend not yet ready - check logs below"
fi

echo ""
echo "📜 Showing logs (Ctrl+C to stop)..."
echo "💡 To verify all services: ./verify-ports.sh"
echo ""
docker-compose logs -f 
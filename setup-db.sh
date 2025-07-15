#!/bin/bash

echo "🐳 Setting up PostgreSQL with pgvector for Memos project..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Start PostgreSQL with Docker Compose
echo "🚀 Starting PostgreSQL container..."
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker-compose exec postgres pg_isready -U memos_user -d memos > /dev/null 2>&1; do
    sleep 1
done

echo "✅ PostgreSQL is ready!"

# Show connection info
echo ""
echo "📋 Database Connection Info:"
echo "Host: localhost"
echo "Port: 5432"
echo "Database: memos"
echo "Username: memos_user"
echo "Password: memos_password"
echo ""

# Check if .env file exists
if [ ! -f "apps/backend/.env" ]; then
    echo "⚠️  Don't forget to create apps/backend/.env file with:"
    echo "PORT=3000"
    echo "DB_HOST=localhost"
    echo "DB_PORT=5432"
    echo "DB_USER=memos_user"
    echo "DB_PASSWORD=memos_password"
    echo "DB_NAME=memos"
    echo "GEMINI_API_KEY=your_gemini_api_key_here"
    echo ""
fi

echo "🎉 Setup complete! You can now start the backend server."
echo "To stop the database: docker-compose down"
echo "To view logs: docker-compose logs -f postgres" 
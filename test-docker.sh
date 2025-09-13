#!/bin/bash

echo "🐳 Testing Docker setup for dybys..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose not found. Please install Docker Compose."
    exit 1
fi

echo "✅ Docker and Docker Compose are available"

# Build and start services
echo "🔨 Building and starting services..."
docker-compose down -v 2>/dev/null
docker-compose up -d --build

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 30

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

# Test endpoints
echo "🧪 Testing endpoints..."

# Test frontend (should return HTML)
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is responding on port 3000"
else
    echo "❌ Frontend is not responding"
fi

# Test backend health endpoint
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ Backend is responding on port 5000"
else
    echo "❌ Backend is not responding"
fi

# Test Solana RPC
if curl -f http://localhost:8899 -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getVersion"}' > /dev/null 2>&1; then
    echo "✅ Solana validator is responding on port 8899"
else
    echo "❌ Solana validator is not responding"
fi

# Test database connection
if docker-compose exec -T postgres pg_isready -U dybys > /dev/null 2>&1; then
    echo "✅ PostgreSQL is ready"
else
    echo "❌ PostgreSQL is not ready"
fi

echo ""
echo "🎵 dybys Docker setup test complete!"
echo "📱 Frontend: http://localhost:3000"
echo "🛠️ Backend: http://localhost:5000"
echo "🔗 Solana RPC: http://localhost:8899"
echo ""
echo "To stop services: docker-compose down"
echo "To view logs: docker-compose logs -f"
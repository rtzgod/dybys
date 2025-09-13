#!/bin/bash

echo "🚀 Updating dybys on VPS with CORS fix..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}✅ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# 1. Pull latest changes
print_info "Pulling latest changes from repository..."
git pull origin main || git pull origin master

# 2. Stop current services
print_info "Stopping current services..."
docker-compose down

# 3. Rebuild and start with new CORS configuration
print_info "Starting services with CORS-enabled Solana validator..."
docker-compose up -d --build

# 4. Wait a moment for services to start
print_info "Waiting for services to initialize..."
sleep 30

# 5. Test CORS configuration
print_info "Testing CORS configuration..."
if curl -s -H "Origin: http://dybys.me:3000" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -X OPTIONS \
        http://localhost:8899 | grep -i "access-control" > /dev/null; then
    print_status "CORS is properly configured!"
else
    echo "⚠️  CORS may not be working properly"
fi

# 6. Test RPC health
print_info "Testing Solana RPC endpoint..."
if curl -s http://localhost:8899 -X POST -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' | grep -q "ok"; then
    print_status "Solana RPC is healthy!"
else
    echo "⚠️  Solana RPC may not be responding properly"
fi

# 7. Show service status
print_info "Checking service status..."
docker-compose ps

echo ""
echo "🎉 Update complete!"
echo "📱 Frontend: http://dybys.me:3000"
echo "🛠️  Backend: http://dybys.me:5000"
echo "⛓️  Solana: http://dybys.me:8899"
echo ""
echo "💡 Changes applied:"
echo "   ✅ CORS enabled for browser wallet connections"
echo "   ✅ WebSocket support added (port 8900)"
echo "   ✅ Enhanced RPC configuration"
echo ""
echo "🔍 If wallet connection still fails:"
echo "   1. Check browser console (F12) for errors"
echo "   2. Try connecting wallet from http://dybys.me:3000 (not HTTPS)"
echo "   3. View logs: docker-compose logs solana-validator"
echo ""
print_status "Ready to test wallet connection! 🎵"
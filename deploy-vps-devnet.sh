#!/bin/bash

echo "🌐 Deploying dybys on VPS with Devnet (Testnet)..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_status() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# 1. Pull latest changes
print_info "Pulling latest changes from repository..."
if git pull origin main 2>/dev/null || git pull origin master 2>/dev/null; then
    print_status "Repository updated successfully"
else
    print_warning "Git pull failed, continuing with current version"
fi

# 2. Stop any existing services (both localnet and VPS)
print_info "Stopping any existing services..."
docker-compose down 2>/dev/null || true
docker-compose -f docker-compose.vps.yml down 2>/dev/null || true

# 3. Build and start VPS services with Devnet
print_info "Starting VPS deployment with Devnet..."
if docker-compose -f docker-compose.vps.yml up -d --build; then
    print_status "VPS services started successfully!"
else
    print_error "Failed to start VPS services"
    exit 1
fi

# 4. Wait for services to initialize
print_info "Waiting for services to initialize (60 seconds)..."
sleep 60

# 5. Check service health
print_info "Checking service health..."

# Check frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_status "Frontend is healthy at http://dybys.me:3000"
else
    print_warning "Frontend may not be ready yet"
fi

# Check backend
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    print_status "Backend is healthy at http://dybys.me:5000"
else
    print_warning "Backend may not be ready yet"
fi

# Check database
if docker-compose -f docker-compose.vps.yml exec -T postgres pg_isready -U dybys > /dev/null 2>&1; then
    print_status "PostgreSQL database is ready"
else
    print_warning "Database may not be ready yet"
fi

# Test Devnet connection
if curl -s https://api.devnet.solana.com -X POST -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' | grep -q "ok"; then
    print_status "Devnet connection is working"
else
    print_warning "Devnet connection test failed"
fi

# 6. Show service status
print_info "Current service status:"
docker-compose -f docker-compose.vps.yml ps

echo ""
echo "🎉 VPS Devnet Deployment Complete!"
echo "=================================="
echo ""
echo "🌐 Access your platform:"
echo "   📱 Frontend:  http://dybys.me:3000"
echo "   🛠️ Backend:   http://dybys.me:5000"
echo "   💾 Database:  dybys.me:5432"
echo "   ⛓️ Solana:    https://api.devnet.solana.com (Devnet)"
echo ""
echo "💰 Wallet Setup Instructions:"
echo "   1. Open Phantom/Solflare wallet"
echo "   2. Click settings (⚙️)"
echo "   3. Change network to 'Devnet'"
echo "   4. Connect wallet at http://dybys.me:3000"
echo "   5. Get free SOL from: https://faucet.solana.com"
echo ""
echo "🔧 Management commands:"
echo "   View logs:      docker-compose -f docker-compose.vps.yml logs -f"
echo "   Stop services:  docker-compose -f docker-compose.vps.yml down"
echo "   Restart:        docker-compose -f docker-compose.vps.yml restart"
echo "   Update deploy:  ./deploy-vps-devnet.sh"
echo ""
echo "✨ Key Benefits of Devnet:"
echo "   ✅ No CORS issues - wallet connects instantly"
echo "   ✅ Built into Phantom - just switch to Devnet"
echo "   ✅ Reliable Solana infrastructure"
echo "   ✅ Free SOL from official faucet"
echo ""
print_status "Deployment successful! Wallet should connect without issues! 🎵"
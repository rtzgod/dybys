# 📋 Prerequisites & Setup Guide

This guide ensures you have everything needed to run the dybys platform successfully.

## 🔧 Required Software

### 1. Docker & Docker Compose
The dybys platform runs entirely in Docker containers.

#### Windows
1. Download [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)
2. Install and restart your computer
3. Start Docker Desktop
4. Verify installation:
   ```bash
   docker --version
   docker-compose --version
   ```

#### macOS
1. Download [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop)
2. Install and start Docker Desktop
3. Verify installation:
   ```bash
   docker --version
   docker-compose --version
   ```

#### Linux (Ubuntu/Debian)
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Add user to docker group (avoid sudo)
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker compose version
```

### 2. Git
```bash
# Windows: Download from https://git-scm.com/download/win
# macOS: Install Xcode Command Line Tools
xcode-select --install

# Linux
sudo apt-get install git

# Verify
git --version
```

### 3. Solana Wallet (For Testing)
- **Phantom Wallet**: [Install browser extension](https://phantom.app/)
- **Solflare**: [Install browser extension](https://solflare.com/)

## 🚀 Quick Setup

### Automated Setup (Recommended)
```bash
# 1. Clone the repository
git clone <repository-url>
cd dybys

# 2. Run the setup script
./setup.sh

# 3. Access the platform
open http://localhost:3000
```

### Manual Setup
```bash
# 1. Clone repository
git clone <repository-url>
cd dybys

# 2. Start Docker services
docker-compose up -d

# 3. Wait 2-3 minutes for all services to start

# 4. Test the platform
./test-docker.sh
```

## 🔍 Verification Steps

### Check Prerequisites
```bash
# Docker is installed and running
docker --version
docker info

# Docker Compose is available  
docker-compose --version

# Git is installed
git --version
```

### Check Port Availability
Make sure these ports are not in use:
- **3000**: Frontend (Next.js)
- **5000**: Backend API (Express.js)
- **5432**: Database (PostgreSQL)
- **8899**: Solana RPC
- **8900**: Solana WebSocket
- **9900**: Solana Faucet

```bash
# Check if ports are free
lsof -i :3000,5000,5432,8899,8900,9900
# Should return empty if ports are available
```

### Verify Docker Services
```bash
# Check all containers are running
docker-compose ps

# Should show all services as "Up" and "healthy"
```

## 🐛 Common Issues & Solutions

### Issue: "Docker is not running"
**Solution**: Start Docker Desktop application

### Issue: "Port already in use"  
**Solutions**:
- Stop services using those ports
- Or modify ports in `docker-compose.yml`

### Issue: "Permission denied" on Linux
**Solution**:
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### Issue: "Cannot connect to Docker daemon"
**Solutions**:
- Start Docker Desktop
- On Linux: `sudo systemctl start docker`

### Issue: Build fails with "No space left on device"
**Solution**:
```bash
# Clean up Docker
docker system prune -a
docker volume prune
```

## 🔄 Environment Files

The platform uses different configurations for different setups:

### Docker Setup (Automatic)
Environment variables are built into `docker-compose.yml`. No manual configuration needed.

### Manual Development Setup
If you want to run services manually (not in Docker):

1. **Backend** (`backend/.env`):
   ```env
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="your-secret-key"
   PORT=3001
   SOLANA_RPC_URL="http://localhost:8899"
   ```

2. **Frontend** (`frontend/.env.local`):
   ```env
   NEXT_PUBLIC_SOLANA_RPC="http://localhost:8899"
   NEXT_PUBLIC_API_URL="http://localhost:3001"
   NEXT_PUBLIC_PROGRAM_ID="FPZCujxx2DPXL2rURe2yqvTKMwzJWcVmaDmq4MRQAhQ"
   ```

## 📈 Performance Requirements

### Minimum System Requirements
- **RAM**: 4GB available
- **Storage**: 10GB free space
- **CPU**: 2 cores
- **Network**: Internet connection for Docker images

### Recommended Specifications
- **RAM**: 8GB available
- **Storage**: 20GB free space
- **CPU**: 4+ cores
- **Network**: Stable broadband connection

## 🧪 Testing Your Setup

### Quick Test
```bash
# Test all services
./test-docker.sh

# Expected output:
# ✅ Frontend responding on port 3000
# ✅ Backend responding on port 5000  
# ✅ Solana validator responding on port 8899
# ✅ PostgreSQL ready
```

### Manual Testing
1. Visit http://localhost:3000
2. Connect Phantom/Solflare wallet
3. Verify 100 SOL airdrop notification
4. Check balance display in navigation
5. Upload a track (Artists)
6. Make an investment (Investors)

## 🆘 Getting Help

### Logs and Debugging
```bash
# View all service logs
docker-compose logs -f

# View specific service logs
docker-compose logs frontend
docker-compose logs backend
docker-compose logs postgres
docker-compose logs solana-validator

# Check service status
docker-compose ps
```

### Reset Everything
```bash
# Complete reset (removes all data)
docker-compose down -v
docker system prune -f
docker-compose up -d --build
```

### Support Channels
- **GitHub Issues**: Report bugs and issues
- **Documentation**: Check README.md
- **Discord**: Community support (if available)

---

✅ **Ready to Start?** Run `./setup.sh` and get your platform running in minutes!
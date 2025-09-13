# 🎵 Dybys - Music Tokenization Platform

A complete decentralized platform for tokenizing music assets built on Solana blockchain. Artists can tokenize their tracks, investors can fund music projects, and all parties share in automated royalty distributions.

![Dybys Platform](https://img.shields.io/badge/Platform-Solana-purple) ![Status](https://img.shields.io/badge/Status-Production%20Ready-green) ![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Key Features

🎧 **Track Tokenization**: Convert music tracks into SPL tokens on Solana  
💰 **Investment Platform**: Investors purchase tokens to fund music projects  
💎 **Automated Royalty Distribution**: Real-time proportional payments to token holders  
💳 **Automatic SOL Airdrop**: New wallets receive 100 SOL instantly for demo purposes  
📊 **Real-time Balance Display**: Live SOL balance in navigation and profile  
🔐 **Multi-Wallet Support**: Phantom, Solflare, and other Solana wallets  
🎨 **Modern UI**: Next.js 15, TypeScript, and Tailwind CSS  
🐳 **Fully Dockerized**: One-command setup for the entire platform  

## 🚀 Quick Start (2 Commands!)

### Prerequisites
- **Docker Desktop** installed and running
- **Git** for cloning the repository
- **Solana Wallet** (Phantom/Solflare) for testing

📋 **Need help installing?** → See [PREREQUISITES.md](./PREREQUISITES.md)

### Automated Setup
```bash
# 1. Clone the repository  
git clone <your-repo-url>
cd dybys

# 2. Run the setup script (handles everything!)
./setup.sh
```

**That's it!** The script will:
- ✅ Check all prerequisites
- ✅ Configure environment files  
- ✅ Build and start all services
- ✅ Test all endpoints
- ✅ Provide access URLs

### Alternative: Manual Docker Setup
```bash
# If you prefer manual control
docker-compose up -d --build

# Wait 2-3 minutes, then test
./test-docker.sh
```

**That's it!** 🎉 You now have:
- ✅ **Frontend** at http://localhost:3000
- ✅ **Backend API** at http://localhost:5000
- ✅ **Solana Validator** at http://localhost:8899 (with unlimited SOL)
- ✅ **PostgreSQL Database** at localhost:5432

## 🎯 Demo Features

### 💸 Automatic SOL Airdrop
- Connect any wallet → Instantly receive **100 SOL**
- No manual funding needed for testing
- Smart balance checking (only airdrops if balance < 50 SOL)
- Toast notifications confirm successful airdrops

### 📊 Live Wallet Balance
- **Navigation Bar**: Real-time SOL balance display
- **Profile Page**: Detailed balance with manual refresh
- Auto-refreshes every 30 seconds
- One-click balance refresh button

### 🔄 Complete User Journey

#### For Artists 🎤
1. **Connect Wallet** → Automatic 100 SOL airdrop
2. **Upload Track** → Audio file + metadata
3. **Set Tokenization** → Supply, price, royalty %
4. **Deploy Tokens** → SPL tokens created on Solana
5. **Go Live** → Track available in marketplace

#### For Investors 💰
1. **Connect Wallet** → Automatic 100 SOL airdrop
2. **Browse Marketplace** → Filter by genre, price, etc.
3. **Make Investment** → Purchase tokens with SOL
4. **Track Portfolio** → Live performance monitoring
5. **Earn Royalties** → Proportional distributions

## 🛠️ Technology Stack

### Frontend
- **Next.js 15** with App Router and TypeScript
- **Tailwind CSS + shadcn/ui** for modern components
- **Solana Wallet Adapter** for multi-wallet support
- **Zustand** for state management with persistence
- **Sonner** for professional toast notifications

### Backend
- **Node.js + Express.js** with TypeScript
- **Prisma ORM** with PostgreSQL database
- **JWT Authentication** for secure API access
- **Multer** for file upload handling

### Blockchain
- **Solana** blockchain with local test validator
- **SPL Token Program** for music tokenization
- **Anchor Framework** for smart contract development
- **Real-time RPC** connection for balance updates

### Infrastructure
- **Docker Compose** for complete containerization
- **Multi-stage builds** for optimized production images
- **Health checks** for all services
- **Volume persistence** for data storage

## 📁 Project Structure

```
dybys/
├── 🐳 Docker Configuration
│   ├── docker-compose.yml          # Production stack
│   ├── docker-compose.dev.yml      # Development with hot reload
│   ├── test-docker.sh              # Automated testing script
│   ├── Makefile                    # Convenient commands
│   └── DOCKER_SETUP.md             # Detailed Docker guide
│
├── 🎨 Frontend (Next.js)
│   ├── app/                        # App router pages
│   ├── components/
│   │   ├── ui/                     # shadcn/ui components
│   │   ├── WalletConnectionHandler.tsx  # Auto-airdrop logic
│   │   ├── WalletBalance.tsx       # Balance display
│   │   ├── Navigation.tsx          # Main navigation
│   │   └── TrackCard.tsx           # Track components
│   ├── lib/
│   │   ├── solana.ts              # Blockchain integration
│   │   └── store.ts               # Zustand state management
│   └── Dockerfile                  # Frontend container
│
├── 🛠️ Backend (Express.js)
│   ├── src/
│   │   ├── routes/                 # API endpoints
│   │   └── index.ts               # Main server
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   └── Dockerfile                  # Backend container
│
└── ⛓️ Smart Contracts
    └── contracts/                  # Solana programs
```

## 🚀 Available Commands

### Docker Commands (Recommended)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# Test all endpoints
./test-docker.sh
```

### Makefile Commands
```bash
make up          # Start all services
make down        # Stop all services
make logs        # View logs
make restart     # Restart with rebuild
make test        # Run test script
```

### Manual Development
```bash
# Start Solana validator
solana-test-validator --reset --quiet

# Start backend (Terminal 2)
cd backend && npm run dev

# Start frontend (Terminal 3)
cd frontend && npm run dev
```

## ⚠️ Common Issues & Quick Fixes

### "Docker is not installed/running"
```bash
# Install Docker Desktop and start it
# Windows/Mac: Download from docker.com
# Linux: curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh
```

### "Port already in use"
```bash
# Check what's using the ports
lsof -i :3000,5000,5432,8899

# Stop conflicting services or change ports in docker-compose.yml
```

### "Permission denied" (Linux)
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### "Build failed" / "No space left"
```bash
docker system prune -a
docker volume prune
```

### "Solana validator not starting" / "File descriptor limit"
```bash
# Check Solana validator logs
docker-compose logs solana-validator

# If you see "UnableToSetOpenFileDescriptorLimit"
docker-compose restart solana-validator

# For persistent issues on Linux
echo "fs.file-max = 2097152" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 🔧 Configuration

### Docker Setup (Recommended)
**No configuration needed!** Environment variables are built into `docker-compose.yml`.

The `./setup.sh` script automatically:
- Creates Docker-compatible `.env` files
- Backs up any existing configuration
- Sets correct ports and database URLs

### Manual Development Setup
Only needed if running services outside Docker:

#### Backend (.env)
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key"
PORT=3001
SOLANA_RPC_URL="http://localhost:8899"
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_SOLANA_RPC="http://localhost:8899"
NEXT_PUBLIC_API_URL="http://localhost:3001"  
NEXT_PUBLIC_PROGRAM_ID="FPZCujxx2DPXL2rURe2yqvTKMwzJWcVmaDmq4MRQAhQ"
```

## 🧪 Testing the Platform

### Automated Testing
```bash
# Run the comprehensive test script
./test-docker.sh

# Expected output:
# ✅ Frontend responding on port 3000
# ✅ Backend responding on port 5000
# ✅ Solana validator responding on port 8899
# ✅ PostgreSQL ready
```

### Manual Testing
1. **Wallet Connection**
   - Visit http://localhost:3000
   - Click "Connect Wallet"
   - Approve connection in Phantom/Solflare
   - Verify 100 SOL airdrop notification
   - Check balance display in navigation

2. **Track Upload** (Artists)
   - Navigate to "Upload" page
   - Select audio file and fill metadata
   - Click "Upload Track"
   - Verify track appears in dashboard

3. **Investment Flow** (Investors)
   - Browse marketplace
   - Apply filters and search
   - Click "Invest" on a track
   - Complete token purchase
   - Check portfolio for updates

## 🐛 Troubleshooting

### Docker Issues
```bash
# Check service status
docker-compose ps

# View specific service logs
docker-compose logs frontend
docker-compose logs backend
docker-compose logs postgres

# Restart specific service
docker-compose restart frontend

# Complete reset
docker-compose down -v
docker-compose up -d --build
```

### Common Issues

#### "Frontend build failed"
```bash
# Check for TypeScript errors
docker-compose logs frontend

# Usually fixed by rebuilding
docker-compose up -d --build
```

#### "Backend not responding"
```bash
# Check database connection
docker-compose logs postgres
docker-compose logs backend

# Ensure database is healthy
docker-compose ps
```

#### "Wallet not connecting"
- Ensure Phantom/Solflare wallet is installed
- Check that you're on the correct network (localhost/devnet)
- Clear browser cache and reload

## 🌐 API Endpoints

### Health Check
```bash
GET /health
# Response: {"status":"OK","timestamp":"2025-01-15T..."}
```

### Authentication
```bash
POST /api/auth/register
POST /api/auth/login
GET /api/auth/profile
```

### Tracks
```bash
GET /api/tracks                    # List all tracks
GET /api/tracks/:id               # Get specific track
POST /api/tracks                  # Create new track
PUT /api/tracks/:id/tokenize      # Tokenize track
```

### Investments
```bash
POST /api/investments/buy         # Purchase tokens
GET /api/investments/portfolio    # Get portfolio
GET /api/investments/track/:id    # Track investments
```

## 📈 Platform Analytics

### Current Capabilities
- ✅ **Real-time Balance Tracking**: Live SOL balance updates
- ✅ **Automatic Funding**: 100 SOL airdrop for new wallets
- ✅ **Investment Analytics**: Portfolio performance tracking
- ✅ **Royalty Calculations**: Proportional distribution logic
- ✅ **Multi-wallet Support**: Profile switching between wallets
- ✅ **Transaction History**: Complete audit trail

### Performance Metrics
- **Frontend Build**: ~60 seconds (optimized)
- **Backend Startup**: ~5 seconds
- **Database Ready**: ~10 seconds
- **Solana Validator**: ~30 seconds
- **Total Setup Time**: ~2 minutes

## 🤝 Contributing

### Development Setup
```bash
# 1. Fork and clone
git clone https://github.com/your-username/dybys.git

# 2. Start development environment
docker-compose -f docker-compose.dev.yml up -d

# 3. Make changes and test
# Hot reload enabled for frontend and backend

# 4. Submit pull request
```

### Code Style
- **TypeScript** for type safety
- **ESLint + Prettier** for formatting
- **Conventional commits** for git messages
- **Component documentation** for complex features

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🎯 Roadmap

### ✅ Completed
- Full Docker containerization
- Automatic SOL airdrop system
- Real-time wallet balance display
- Multi-wallet profile management
- Proportional royalty distribution
- Professional UI/UX with toast notifications

### 🔄 In Progress
- Smart contract optimization
- Enhanced portfolio analytics
- Mobile app development

### 📋 Planned
- Mainnet deployment
- Advanced trading features
- Social features and artist profiles
- NFT integration for album artwork

## 📞 Support

- **Documentation**: Check [DOCKER_SETUP.md](./DOCKER_SETUP.md) for detailed setup
- **Issues**: Report bugs on [GitHub Issues](https://github.com/your-username/dybys/issues)
- **Community**: Join our [Discord](https://discord.gg/dybys) for discussions
- **Email**: support@dybys.io for direct support

---

**🎵 dybys - Where Music Meets Decentralized Finance**

*Built with ❤️ for the music industry and Solana ecosystem*

[![Deploy](https://img.shields.io/badge/Deploy-Docker-blue)](./DOCKER_SETUP.md)
[![Demo](https://img.shields.io/badge/Live-Demo-green)](http://localhost:3000)
[![Solana](https://img.shields.io/badge/Blockchain-Solana-purple)](https://solana.com)
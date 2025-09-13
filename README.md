# 🎵 Dybys - Music Tokenization Platform (WIP)

A decentralized music platform for track uploading and tokenization, built with Next.js and Express.js. Currently in development with basic functionality implemented.

![Platform](https://img.shields.io/badge/Platform-Web-blue) ![Status](https://img.shields.io/badge/Status-In%20Development-yellow) ![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Current Features

🎧 **Track Upload**: Artists can upload music files with metadata
🔐 **Wallet Connection**: Phantom wallet integration with Solana
💳 **Auto SOL Airdrop**: New wallets receive 100 SOL for testing
📊 **Track Management**: Basic CRUD operations for music tracks
🎨 **Modern UI**: Next.js 15 with shadcn/ui components
🐳 **Docker Setup**: Containerized development environment
🗄️ **Database**: SQLite with Prisma ORM for data storage  

## 🚀 Quick Start

### Prerequisites
- **Docker Desktop** installed and running
- **Git** for cloning the repository
- **Phantom Wallet** browser extension for wallet connection

### Setup
```bash
# 1. Clone the repository
git clone <your-repo-url>
cd dybys

# 2. Run the setup script
./setup.sh
```

The setup script will configure environment files and start all services via Docker.

### Manual Docker Setup (Alternative)
```bash
# Start all services
docker-compose up -d --build
```

**Access the application:**
- ✅ **Frontend** at http://localhost:3000
- ✅ **Backend API** at http://localhost:5000
- ✅ **Solana Validator** at http://localhost:8899
- ✅ **PostgreSQL Database** at localhost:5432

## 🎯 Current Functionality

### 💳 Wallet Integration
- Connect Phantom wallet
- Automatic 100 SOL airdrop for new wallets (if balance < 50 SOL)
- Basic balance checking and display

### 🎧 Track Management
- Upload audio files (up to 50MB)
- Add track metadata (title, description, genre)
- View uploaded tracks in artist dashboard
- Basic track listing and browsing

### 🗄️ Data Storage
- User profiles linked to wallet addresses
- Track metadata and file storage
- SQLite database with Prisma ORM

### ⚠️ Limitations
- **No actual tokenization**: SPL token creation not implemented
- **No marketplace**: Investment features are UI-only
- **No smart contracts**: Blockchain integration is minimal
- **Local development only**: No production deployment setup

## 🛠️ Technology Stack

### Frontend
- **Next.js 15** with App Router and TypeScript
- **Tailwind CSS + shadcn/ui** for modern components
- **Solana Wallet Adapter** for wallet connection
- **Zustand** for state management
- **Sonner** for toast notifications

### Backend
- **Node.js + Express.js** with TypeScript
- **Prisma ORM** with SQLite database
- **JWT Authentication** (basic implementation)
- **Multer** for file upload handling

### Blockchain
- **Solana Wallet Integration** for wallet connection
- **Local Solana test validator** via Docker
- **Basic balance checking** and airdrop functionality

### Infrastructure
- **Docker Compose** for containerization
- **PostgreSQL** (configured but SQLite used)
- **Volume persistence** for uploads and data

## 📁 Project Structure

```
dybys/
├── 🐳 Docker Configuration
│   ├── docker-compose.yml          # Main docker configuration
│   ├── docker-compose.vps.yml      # VPS deployment config
│   ├── setup.sh                    # Setup script
│   └── Makefile                    # Make commands
│
├── 🎨 Frontend (Next.js)
│   ├── app/                        # App router pages
│   │   ├── page.tsx               # Home page
│   │   ├── marketplace/           # Marketplace page
│   │   ├── artist/                # Artist pages
│   │   └── profile/               # Profile page
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── WalletConnect.tsx      # Wallet connection
│   │   ├── Navigation.tsx         # Main navigation
│   │   └── TrackCard.tsx          # Track display
│   ├── lib/
│   │   ├── solana.ts              # Solana utilities
│   │   ├── store.ts               # Zustand store
│   │   └── utils.ts               # Helper functions
│   └── Dockerfile                 # Frontend container
│
├── 🛠️ Backend (Express.js)
│   ├── src/
│   │   ├── routes/                # API endpoints
│   │   │   ├── auth.ts            # Authentication
│   │   │   ├── tracks.ts          # Track management
│   │   │   └── investments.ts     # Investment (placeholder)
│   │   └── index.ts               # Main server
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   └── Dockerfile                 # Backend container
│
├── 📋 Documentation
│   ├── README.md                  # This file
│   └── VPS_DEPLOYMENT.md          # VPS deployment guide
│
└── 🧪 Development
    └── test-ledger/               # Local Solana validator data
```

## 🚀 Available Commands

### Docker Commands (Recommended)
```bash
# Start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Check service status
docker-compose ps
```

### Development Commands
```bash
# Frontend development
cd frontend && npm run dev

# Backend development
cd backend && npm run dev

# Database operations
cd backend && npx prisma migrate dev
cd backend && npx prisma generate
```

## 🧪 Testing the Application

### Manual Testing
1. **Wallet Connection**
   - Visit http://localhost:3000
   - Click "Connect Wallet"
   - Approve connection in Phantom wallet
   - Verify 100 SOL airdrop notification

2. **Track Upload** (Artists)
   - Navigate to Artist → Upload page
   - Select audio file and fill metadata
   - Click "Upload Track"
   - Verify track appears in dashboard

3. **Browse Tracks**
   - Visit marketplace page
   - View uploaded tracks
   - Note: Investment functionality is UI-only

## 🌐 API Endpoints

### Health Check
```bash
GET /health
# Response: {"status":"OK","timestamp":"2025-01-15T..."}
```

### Track Management
```bash
GET /api/tracks                    # List all tracks
GET /api/tracks/:id               # Get specific track
POST /api/tracks/upload           # Upload new track (requires auth)
POST /api/tracks/:id/tokenize     # Prepare track for tokenization
```

### Authentication
```bash
POST /api/auth/register           # Register user
POST /api/auth/login              # Login user
GET /api/auth/profile             # Get user profile
```

## 🎯 Development Roadmap

### ✅ Implemented
- Basic track upload and storage
- Wallet connection with Phantom
- Auto SOL airdrop for testing
- Docker containerization
- Database schema and models

### 🚧 In Development
- Smart contract integration
- Actual SPL token creation
- Investment marketplace
- User authentication system

### 📋 Planned
- Real tokenization with smart contracts
- Marketplace with actual trading
- Royalty distribution system
- Production deployment

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**🎵 dybys - Music Tokenization Platform**

*A work-in-progress platform for decentralized music tokenization*
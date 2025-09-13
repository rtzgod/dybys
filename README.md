# 🎵 Dybys - Music Tokenization Platform on Solana

A decentralized platform for tokenizing music assets built on Solana blockchain. Artists can tokenize their tracks, investors can fund music projects, and all parties share in royalty distributions.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Smart Contract](#smart-contract)
- [Frontend Components](#frontend-components)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

### Key Features

- **Track Tokenization**: Artists convert music tracks into SPL tokens on Solana
- **Investment Platform**: Investors purchase tokens to fund music projects
- **Royalty Distribution**: Automated royalty sharing between artists and token holders
- **Wallet Integration**: Phantom and Solflare wallet support
- **Modern UI**: Built with Next.js, TypeScript, and Tailwind CSS
- **Secure Backend**: Express.js API with JWT authentication and Prisma ORM

### Technology Stack

**Frontend**:
- Next.js 15 with App Router
- TypeScript
- Tailwind CSS + shadcn/ui
- Solana Wallet Adapter
- React Query (TanStack)
- Zustand (state management)

**Backend**:
- Node.js + Express.js
- TypeScript
- Prisma ORM + SQLite
- JWT Authentication
- Multer (file uploads)

**Blockchain**:
- Solana blockchain
- Anchor Framework
- SPL Token Program
- Rust smart contracts

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│   Frontend      │◄──►│   Backend API   │◄──►│  Solana Smart   │
│   (Next.js)     │    │   (Express)     │    │   Contract      │
│                 │    │                 │    │   (Rust/Anchor) │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│ Solana Wallet   │    │ SQLite Database │    │ Solana Validator│
│ (Phantom/etc)   │    │ (Prisma ORM)    │    │ (Local/Mainnet) │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Prerequisites

### System Requirements

- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **Rust**: Latest stable version
- **Solana CLI**: v1.18.0 or higher
- **Anchor CLI**: v0.31.0 or higher

### Development Tools

- **Git**: For version control
- **VS Code**: Recommended editor with extensions:
  - Rust Analyzer
  - Solana
  - Prisma
  - Tailwind CSS IntelliSense

### Browser Requirements

- **Phantom Wallet**: For Solana interaction
- **Modern Browser**: Chrome, Firefox, Safari, Edge

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd dybys

# Install dependencies for all modules
npm install --prefix backend
npm install --prefix frontend
```

### 2. Set Up Environment

```bash
# Backend environment
cp backend/.env.example backend/.env
# Edit backend/.env with your configurations

# Frontend environment  
cp frontend/.env.local.example frontend/.env.local
# Edit frontend/.env.local with your configurations
```

### 3. Initialize Database

```bash
cd backend
npx prisma generate
npx prisma db push
```

### 4. Set Up Solana

```bash
# Create Solana keypair
solana-keygen new -o ~/.config/solana/id.json

# Set to localhost for development
solana config set --url localhost
```

### 5. Start All Services

```bash
# Terminal 1: Start Solana validator
solana-test-validator

# Terminal 2: Start backend
cd backend && npm run dev

# Terminal 3: Deploy smart contract
cd smart-contracts/contracts
anchor build
anchor deploy --provider.cluster localnet

# Terminal 4: Start frontend
cd frontend && npm run dev
```

### 6. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 📖 Detailed Setup

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Configure database
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

#### Environment Variables (.env)

```env
# Database
DATABASE_URL="file:./dev.db"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Server Configuration
PORT=3001

# Solana Configuration
SOLANA_RPC_URL="http://localhost:8899"
PROGRAM_ID="FPZCujxx2DPXL2rURe2yqvTKMwzJWcVmaDmq4MRQAhQ"

# File Upload
MAX_FILE_SIZE=52428800
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up shadcn/ui components
npx shadcn@latest init
npx shadcn@latest add dialog tabs button card input label textarea badge progress

# Install Solana dependencies
npm install @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets @coral-xyz/anchor

# Start development server
npm run dev
```

#### Environment Variables (.env.local)

```env
# Solana Configuration
NEXT_PUBLIC_SOLANA_RPC="http://localhost:8899"
NEXT_PUBLIC_SOLANA_NETWORK="localhost"
NEXT_PUBLIC_PROGRAM_ID="FPZCujxx2DPXL2rURe2yqvTKMwzJWcVmaDmq4MRQAhQ"

# Backend API
NEXT_PUBLIC_API_URL="http://localhost:3001"

# Development Settings
NEXT_PUBLIC_DEV_MODE="true"
```

### Smart Contract Setup

```bash
cd smart-contracts/contracts

# Initialize Anchor project (if not done)
anchor init . --javascript

# Build the contract
anchor build

# Start local validator (separate terminal)
solana-test-validator

# Fund your wallet
solana airdrop 10

# Deploy to local validator
anchor deploy --provider.cluster localnet
```

## 📁 Project Structure

```
dybys/
├── backend/                    # Express.js API server
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts        # Authentication endpoints
│   │   │   ├── tracks.ts      # Track management
│   │   │   └── investments.ts # Investment tracking
│   │   └── index.ts           # Main server file
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── uploads/               # File storage
│   ├── package.json
│   └── .env
│
├── frontend/                   # Next.js application
│   ├── app/
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── WalletProvider.tsx # Solana wallet context
│   │   ├── WalletConnect.tsx  # Wallet connection
│   │   ├── Navigation.tsx     # App navigation
│   │   └── TrackCard.tsx      # Music track component
│   ├── lib/
│   │   └── solana.ts          # Solana integration
│   ├── package.json
│   └── .env.local
│
├── smart-contracts/            # Solana smart contracts
│   └── contracts/
│       ├── programs/
│       │   └── contracts/
│       │       └── src/
│       │           └── lib.rs # Main contract code
│       ├── Anchor.toml        # Anchor configuration
│       └── Cargo.toml         # Rust dependencies
│
└── README.md                   # This documentation
```

## 🔌 API Documentation

### Authentication Endpoints

#### POST /api/auth/register
Register a new user (artist or investor)

```json
{
  "walletAddress": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  "email": "artist@example.com",
  "role": "ARTIST"
}
```

#### POST /api/auth/login
Login with wallet address

```json
{
  "walletAddress": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"
}
```

#### GET /api/auth/profile
Get user profile (requires JWT token)

### Track Endpoints

#### GET /api/tracks
Get all tracks

#### GET /api/tracks/:id
Get specific track details

#### POST /api/tracks/upload
Upload a new track (artists only)

```json
{
  "title": "My New Song",
  "metadata": "{\"genre\": \"electronic\", \"duration\": 180}",
  "audioFile": "[multipart file]"
}
```

#### POST /api/tracks/:id/tokenize
Tokenize a track

```json
{
  "totalSupply": 1000,
  "pricePerToken": 0.1,
  "royaltyPercentage": 1000
}
```

### Investment Endpoints

#### POST /api/investments/buy
Record token purchase

#### GET /api/investments/portfolio
Get investor portfolio

#### GET /api/investments/track/:trackId
Get investments for specific track

## 🔗 Smart Contract

### Core Functions

#### initialize_track
Creates a new track record on-chain

```rust
pub fn initialize_track(
    ctx: Context<InitializeTrack>,
    title: String,
    metadata_uri: String,
    total_supply: u64,
    price_per_token: u64,
    royalty_percentage: u16,
) -> Result<()>
```

#### tokenize_track  
Converts track to SPL tokens

```rust
pub fn tokenize_track(ctx: Context<TokenizeTrack>) -> Result<()>
```

#### distribute_royalties
Handles royalty payments

```rust
pub fn distribute_royalties(
    ctx: Context<DistributeRoyalties>, 
    royalty_amount: u64
) -> Result<()>
```

### Account Structure

#### Track Account
```rust
pub struct Track {
    pub artist: Pubkey,
    pub title: String,           // max 100 chars
    pub metadata_uri: String,    // max 200 chars  
    pub token_mint: Pubkey,
    pub total_supply: u64,
    pub tokens_sold: u64,
    pub price_per_token: u64,
    pub royalty_percentage: u16, // basis points
    pub total_royalties_collected: u64,
    pub is_tokenized: bool,
    pub bump: u8,
}
```

## 🧪 Testing

### Complete Testing Flow

#### 1. Start All Services
```bash
# Terminal 1: Solana validator
solana-test-validator

# Terminal 2: Backend
cd backend && npm run dev

# Terminal 3: Frontend  
cd frontend && npm run dev
```

#### 2. Test Wallet Connection
1. Open http://localhost:3000
2. Click "Connect Wallet" button
3. Approve in Phantom/Solflare
4. Verify wallet address displays

#### 3. Test API Endpoints
```bash
# Health check
curl http://localhost:3001/health

# Register user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"AXpH6GJW2CnV3aWi2eg1erWKtcFSuK3n9nn39miEnH4D","email":"test@example.com","role":"ARTIST"}'

# Get tracks
curl http://localhost:3001/api/tracks
```

## 🚀 Deployment

### Quick Deploy Script

Create `deploy.sh`:
```bash
#!/bin/bash

echo "🚀 Deploying Music Tokenization Platform..."

# Build backend
echo "📦 Building backend..."
cd backend
npm run build

# Build frontend
echo "🎨 Building frontend..."
cd ../frontend  
npm run build

# Deploy smart contract to devnet
echo "⛓️ Deploying smart contract..."
cd ../smart-contracts/contracts
solana config set --url devnet
anchor build
anchor deploy --provider.cluster devnet

echo "✅ Deployment complete!"
```

### Production Checklist

- [ ] Update environment variables for production
- [ ] Configure production database (PostgreSQL)
- [ ] Set up SSL certificates
- [ ] Configure CORS for production domains
- [ ] Set up monitoring and logging
- [ ] Configure backup strategies
- [ ] Test all endpoints in production environment

## 🛠️ Troubleshooting

### Quick Fixes

#### "Module not found" errors
```bash
# Frontend
cd frontend && npm install

# Backend  
cd backend && npm install
```

#### Wallet connection issues
```bash
# Check environment variables
cat frontend/.env.local

# Ensure Phantom wallet is installed
# Verify network matches (localhost/devnet/mainnet)
```

#### Database connection errors
```bash
cd backend
npx prisma generate
npx prisma db push
```

#### Smart contract deployment failures
```bash
# Check Solana config
solana config get

# Fund wallet
solana airdrop 10

# Rebuild and deploy
anchor build
anchor deploy --provider.cluster localnet
```

## 📞 Support & Contributing

### Getting Help
- Create GitHub issues for bugs
- Check existing documentation first
- Join Solana developer Discord

### Contributing
1. Fork repository
2. Create feature branch
3. Make changes
4. Submit pull request

## 🎯 Current State & Recent Updates

### ✅ Completed Features

- **Full Data Flow Integration**: Complete end-to-end functionality from upload → tokenize → marketplace → portfolio
- **Zustand State Management**: Global state management with persistent storage
- **Portfolio Details Dialog**: Interactive investment details with performance metrics
- **Real-time Investment Tracking**: All pages now use real data from the store
- **Responsive UI**: Modern interface with shadcn/ui components
- **Wallet Integration**: Phantom/Solflare wallet connection working

### 📋 Current Workflow

1. **Artist uploads track** → Saved to Zustand store
2. **Artist tokenizes track** → Updates track with tokenization parameters  
3. **Track appears in marketplace** → Real data from store displayed
4. **Investors purchase tokens** → Investment recorded in store
5. **Portfolio shows investments** → Real investment data with details dialog

### 🔧 Setup Instructions (Updated)

```bash
# 1. Install Zustand (required for data flow)
cd frontend && npm install zustand

# 2. Start all services
# Terminal 1: Solana validator
solana-test-validator

# Terminal 2: Backend (optional - using client-side store)
cd backend && npm run dev

# Terminal 3: Frontend
cd frontend && npm run dev

# 4. Access application
open http://localhost:3000
```

### 🎵 How to Test the Complete Flow

1. **Connect Wallet** - Click "Connect Wallet" in top navigation
2. **Upload Track** - Go to Upload page, add audio file and track info
3. **Tokenize Track** - Set token parameters and create tokens
4. **View in Marketplace** - See your track listed for investment
5. **Make Investment** - Connect different wallet and invest in tracks  
6. **Check Portfolio** - View investments with detailed metrics
7. **View Details** - Click "View Details" for comprehensive investment info

### 💾 Data Persistence

- All data persists in browser localStorage via Zustand
- Mock royalty calculations and value appreciation for demo
- Real wallet addresses and transaction simulation

---

**Built with ❤️ for the Solana ecosystem**

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Create comprehensive documentation for the music tokenization platform", "status": "completed", "activeForm": "Creating comprehensive documentation"}]
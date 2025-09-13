# 🐳 Docker Setup Guide for dybys

This guide will help you set up the entire dybys music tokenization platform using Docker.

## 🚀 Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0+)
- Git

### One-Command Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd dybys

# Start all services in production mode
docker-compose up -d

# OR start in development mode with hot reload
docker-compose -f docker-compose.dev.yml up -d
```

## 📋 Services Overview

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | Next.js React application |
| Backend | 5000 | Node.js API server |
| PostgreSQL | 5432 | Database |
| Solana Validator | 8899 | Local Solana blockchain |
| Solana WebSocket | 8900 | WebSocket connection |
| Solana Faucet | 9900 | SOL airdrop service |

## 🏗️ Production Setup

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes all data)
docker-compose down -v
```

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Database**: localhost:5432 (dybys/dybys123)
- **Solana RPC**: http://localhost:8899

## 🛠️ Development Setup

```bash
# Start in development mode with hot reload
docker-compose -f docker-compose.dev.yml up -d

# View development logs
docker-compose -f docker-compose.dev.yml logs -f frontend backend

# Restart a specific service
docker-compose -f docker-compose.dev.yml restart frontend
```

### Development Features

- **Hot Reload**: Code changes automatically reload the application
- **Volume Mounting**: Source code is mounted for live editing
- **Debug Logging**: Enhanced logging for development

## 💰 Solana Setup

### Airdrop SOL for Testing

```bash
# Get your wallet address from the frontend, then:
docker-compose exec solana-validator solana airdrop 10 YOUR_WALLET_ADDRESS

# Or use the CLI directly:
solana airdrop 10 YOUR_WALLET_ADDRESS --url http://localhost:8899
```

### Configure Wallet

1. Open your Solana wallet (Phantom, Solflare, etc.)
2. Switch to **Custom Network**:
   - **RPC URL**: `http://localhost:8899`
   - **Network Name**: `Localhost`

## 🗄️ Database Management

### Access PostgreSQL

```bash
# Connect to database
docker-compose exec postgres psql -U dybys -d dybys

# Run migrations (if needed)
docker-compose exec backend npx prisma migrate dev

# View database in GUI tool:
# Host: localhost:5432
# Database: dybys
# Username: dybys
# Password: dybys123
```

## 🔧 Environment Variables

### Production (.env)

Create a `.env` file in the root directory:

```env
# Database
POSTGRES_USER=dybys
POSTGRES_PASSWORD=dybys123
POSTGRES_DB=dybys

# Backend
JWT_SECRET=your-super-secret-jwt-key-change-this
NODE_ENV=production

# Frontend
NEXT_PUBLIC_SOLANA_RPC=http://localhost:8899
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_PROGRAM_ID=FPZCujxx2DPXL2rURe2yqvTKMwzJWcVmaDmq4MRQAhQ
```

### Development Overrides

Create a `.env.local` file for development-specific settings.

## 📊 Monitoring & Logs

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f solana-validator

# Last 100 lines
docker-compose logs --tail=100 frontend
```

### Health Checks

```bash
# Check service status
docker-compose ps

# Test endpoints
curl http://localhost:3000  # Frontend
curl http://localhost:5000/health  # Backend
curl http://localhost:8899 -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getVersion"}'  # Solana
```

## 🚨 Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check what's using the ports
   sudo lsof -i :3000
   sudo lsof -i :5000
   sudo lsof -i :8899
   
   # Kill processes or change ports in docker-compose.yml
   ```

2. **Database Connection Issues**
   ```bash
   # Restart PostgreSQL
   docker-compose restart postgres
   
   # Check database logs
   docker-compose logs postgres
   ```

3. **Solana Validator Not Starting**
   ```bash
   # Clear Solana data and restart
   docker-compose down
   docker volume rm dybys_solana_data
   docker-compose up -d solana-validator
   ```

4. **Permission Issues**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   ```

### Reset Everything

```bash
# Nuclear option: remove all containers, images, and data
docker-compose down -v
docker system prune -a
docker volume prune
```

## 🔄 Updates & Maintenance

### Update Images

```bash
# Pull latest images
docker-compose pull

# Rebuild and restart
docker-compose up -d --build
```

### Backup Data

```bash
# Backup database
docker-compose exec postgres pg_dump -U dybys dybys > backup.sql

# Backup volumes
docker run --rm -v dybys_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data
```

### Restore Data

```bash
# Restore database
cat backup.sql | docker-compose exec -T postgres psql -U dybys -d dybys
```

## 🏭 Production Deployment

For production deployment, consider:

1. **Use external database** (AWS RDS, Google Cloud SQL)
2. **Use managed Solana** (Mainnet, Devnet) instead of local validator
3. **Add reverse proxy** (nginx, Traefik)
4. **Enable HTTPS** with SSL certificates
5. **Set up monitoring** (Prometheus, Grafana)
6. **Configure backups** and disaster recovery

### Production Environment Variables

```env
DATABASE_URL=postgresql://user:pass@your-prod-db:5432/dybys
NEXT_PUBLIC_SOLANA_RPC=https://api.mainnet-beta.solana.com
JWT_SECRET=your-very-secure-production-secret
```

## 🎵 Using the Application

1. **Start the services**: `docker-compose up -d`
2. **Open**: http://localhost:3000
3. **Connect wallet** and switch to localhost network
4. **Airdrop SOL** to your wallet for testing
5. **Upload a track** and tokenize it
6. **Make investments** and test royalty distributions

## 📝 Development Workflow

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# Make code changes (auto-reload enabled)
# Edit files in ./frontend or ./backend

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop development environment
docker-compose -f docker-compose.dev.yml down
```

---

🎉 **That's it!** Your dybys platform should now be running with Docker. Happy tokenizing! 🎵
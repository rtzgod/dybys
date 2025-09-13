# 🚀 Quick Start Guide

Get the dybys platform running in under 5 minutes!

## Step 1: Prerequisites ✅

Make sure you have:
- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and **running**
- [Git](https://git-scm.com/) installed  
- A Solana wallet ([Phantom](https://phantom.app/) or [Solflare](https://solflare.com/)) for testing

## Step 2: Clone and Setup ⬇️

```bash
# Clone the repository
git clone <your-repository-url>
cd dybys

# Run the automated setup
./setup.sh
```

## Step 3: Access the Platform 🌐

Open your browser to:
- **🎨 Frontend**: http://localhost:3000
- **🛠️ Backend**: http://localhost:5000  
- **⛓️ Solana**: http://localhost:8899

## Step 4: Test Demo Features 🎵

1. **Connect Wallet** → Get 100 SOL automatically! 💰
2. **Check Balance** → See live SOL balance in navigation 📊
3. **Upload Track** (Artists) → Tokenize your music 🎤
4. **Make Investment** (Investors) → Buy track tokens 💎
5. **View Portfolio** → Track your investments 📈

## What the Setup Script Does

The `./setup.sh` script automatically:

✅ **Checks Prerequisites**
- Verifies Docker is installed and running
- Confirms all required ports are available
- Checks system requirements

✅ **Configures Environment**  
- Creates Docker-compatible `.env` files
- Backs up existing configurations
- Sets correct ports and service URLs

✅ **Builds & Starts Services**
- PostgreSQL database with schema
- Solana test validator (unlimited SOL!)
- Backend API with health checks
- Frontend with hot reloading

✅ **Tests Everything**
- Verifies all services are responding
- Confirms database connections
- Tests API endpoints
- Validates Solana RPC access

## Troubleshooting 🛠️

### Setup Script Issues
```bash
# Make sure script is executable
chmod +x setup.sh

# Re-run setup with verbose output
./setup.sh 2>&1 | tee setup.log
```

### Docker Issues
```bash
# Check Docker status
docker --version
docker info

# View service logs
docker-compose logs -f

# Restart services
docker-compose restart
```

### Port Conflicts
```bash
# Check what's using ports
lsof -i :3000,5000,5432,8899

# Stop conflicting services
sudo systemctl stop nginx  # example
```

## Manual Setup (Alternative)

If you prefer manual control:

```bash
# 1. Start services
docker-compose up -d --build

# 2. Wait for startup (2-3 minutes)
sleep 180

# 3. Test endpoints
./test-docker.sh
```

## Next Steps 📚

- 📖 Read the full [README.md](./README.md) for detailed documentation
- 🐳 Check [DOCKER_SETUP.md](./DOCKER_SETUP.md) for Docker details
- 🔧 See [PREREQUISITES.md](./PREREQUISITES.md) for installation help
- 🧪 Try all demo features and workflows

---

**🎉 Ready to tokenize music on Solana!** 

Need help? Check the logs with `docker-compose logs -f` or open an issue on GitHub.
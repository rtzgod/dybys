# 🌐 VPS Deployment Guide

This guide covers deploying dybys on a VPS with two network options: **Localnet** (your own validator) and **Devnet** (Solana's testnet).

## 🚀 Quick Devnet Deployment (Recommended for Production)

**Why Devnet?** No wallet connection issues, instant setup, reliable infrastructure.

### Setup Steps:
```bash
# 1. Pull latest changes
git pull

# 2. Deploy on Devnet (automated)
chmod +x deploy-vps-devnet.sh
./deploy-vps-devnet.sh
```

**That's it!** Your platform runs on Solana Devnet with zero wallet connection issues.

### User Instructions:
1. Visit **http://dybys.me:3000**
2. Open Phantom wallet → Settings → Switch to **"Devnet"**
3. Connect wallet (works instantly!)
4. Get free SOL: https://faucet.solana.com

---

## 🏠 Localnet Deployment (Development/Testing)

**Why Localnet?** Full control, unlimited SOL, isolated environment.

### Setup Steps:
```bash
# 1. Pull latest changes
git pull

# 2. Deploy with local validator (CORS-enabled)
chmod +x deploy-vps-update.sh
./deploy-vps-update.sh
```

### User Instructions:
1. Visit **http://dybys.me:3000**
2. Phantom wallet connects to your validator automatically
3. Get 100 SOL instantly on wallet connection

---

## 📊 Comparison

| Feature | Localnet (docker-compose.yml) | Devnet (docker-compose.vps.yml) |
|---------|--------------------------------|----------------------------------|
| **Wallet Connection** | May need CORS fixes | ✅ Works instantly |
| **SOL Funding** | ✅ Auto 100 SOL | Manual faucet |
| **Network Control** | ✅ Full control | Shared testnet |
| **Reliability** | Depends on setup | ✅ Solana infrastructure |
| **User Experience** | Complex setup | ✅ Simple |

## 🔧 Available Commands

### Devnet Deployment:
```bash
# Deploy/Update
./deploy-vps-devnet.sh

# Manage services
docker-compose -f docker-compose.vps.yml up -d
docker-compose -f docker-compose.vps.yml down
docker-compose -f docker-compose.vps.yml logs -f
```

### Localnet Deployment:
```bash
# Deploy/Update
./deploy-vps-update.sh

# Manage services
docker-compose up -d
docker-compose down
docker-compose logs -f
```

## 🎯 Recommendations

### **For Production Demo:** Use Devnet
- ✅ Guaranteed wallet connectivity
- ✅ Professional user experience
- ✅ Zero configuration for users

### **For Development:** Use Localnet
- ✅ Full control over environment
- ✅ Faster iteration
- ✅ Unlimited SOL for testing

## 🆘 Troubleshooting

### Devnet Issues:
- **Wallet won't connect:** Make sure user switched to Devnet in wallet
- **No SOL:** Direct users to https://faucet.solana.com
- **Slow transactions:** Devnet can be slower during peak usage

### Localnet Issues:
- **Infinite connecting:** Run `./deploy-vps-update.sh` to fix CORS
- **Port blocked:** Check firewall: `sudo ufw allow 8899`
- **Validator crashes:** Check logs: `docker-compose logs solana-validator`

## 📱 Service URLs

### Devnet Deployment:
- Frontend: http://dybys.me:3000
- Backend: http://dybys.me:5000
- Solana: https://api.devnet.solana.com

### Localnet Deployment:
- Frontend: http://dybys.me:3000
- Backend: http://dybys.me:5000
- Solana: http://dybys.me:8899

---

**Choose your deployment method and get started!** 🎵
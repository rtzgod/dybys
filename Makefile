# dybys Docker Management

.PHONY: help up down dev logs clean build restart airdrop

# Default target
help:
	@echo "🎵 dybys Docker Management"
	@echo ""
	@echo "Production Commands:"
	@echo "  make up        Start all services in production mode"
	@echo "  make down      Stop all services"
	@echo "  make build     Build all Docker images"
	@echo "  make logs      Show logs for all services"
	@echo ""
	@echo "Development Commands:"
	@echo "  make dev       Start all services in development mode"
	@echo "  make dev-down  Stop development services"
	@echo "  make dev-logs  Show development logs"
	@echo ""
	@echo "Utility Commands:"
	@echo "  make restart   Restart all services"
	@echo "  make clean     Remove all containers and volumes"
	@echo "  make airdrop   Airdrop SOL to wallet (requires WALLET env var)"
	@echo "  make status    Show service status"
	@echo ""
	@echo "Examples:"
	@echo "  make airdrop WALLET=YOUR_WALLET_ADDRESS"

# Production commands
up:
	docker-compose up -d

down:
	docker-compose down

build:
	docker-compose build

logs:
	docker-compose logs -f

restart:
	docker-compose restart

# Development commands
dev:
	docker-compose -f docker-compose.dev.yml up -d

dev-down:
	docker-compose -f docker-compose.dev.yml down

dev-logs:
	docker-compose -f docker-compose.dev.yml logs -f

dev-restart:
	docker-compose -f docker-compose.dev.yml restart

# Utility commands
status:
	docker-compose ps

clean:
	docker-compose down -v
	docker system prune -f

airdrop:
	@if [ -z "$(WALLET)" ]; then \
		echo "❌ Please provide WALLET address: make airdrop WALLET=YOUR_ADDRESS"; \
	else \
		echo "💰 Airdropping 10 SOL to $(WALLET)..."; \
		docker-compose exec solana-validator solana airdrop 10 $(WALLET); \
	fi

# Database commands
db-migrate:
	docker-compose exec backend npx prisma migrate dev

db-reset:
	docker-compose exec backend npx prisma migrate reset

db-connect:
	docker-compose exec postgres psql -U dybys -d dybys

# Health checks
health:
	@echo "🏥 Checking service health..."
	@curl -f http://localhost:3000 > /dev/null 2>&1 && echo "✅ Frontend: OK" || echo "❌ Frontend: FAIL"
	@curl -f http://localhost:5000/health > /dev/null 2>&1 && echo "✅ Backend: OK" || echo "❌ Backend: FAIL"
	@curl -f http://localhost:8899 -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getVersion"}' > /dev/null 2>&1 && echo "✅ Solana: OK" || echo "❌ Solana: FAIL"
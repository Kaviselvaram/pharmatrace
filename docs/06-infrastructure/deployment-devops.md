# Deployment & DevOps Specification
**One-Command Orchestration & Production Staging Architecture**

---

## 1. DOCKER COMPOSE LOCAL-FIRST ORCHESTRATION

The entire system is packaged into three containerized services managed by `docker-compose.yml`:

```yaml
version: '3.8'

services:
  # 1. Local Hardhat EVM Blockchain
  blockchain:
    image: node:22-alpine
    container_name: infosec-evm
    working_dir: /contracts
    volumes:
      - ./contracts:/contracts
    command: sh -c "npm install && npx hardhat node --hostname 0.0.0.0"
    ports:
      - "8545:8545"
    healthcheck:
      test: ["CMD", "nc", "-z", "localhost", "8545"]
      interval: 5s
      timeout: 5s
      retries: 5

  # 2. FastAPI Backend & Simulation Engine
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: infosec-backend
    environment:
      - RPC_URL=http://blockchain:8545
      - DB_URL=sqlite:///./supplychain.db
      - GEMINI_API_KEY=${GEMINI_API_KEY:-}
    ports:
      - "8000:8000"
    depends_on:
      blockchain:
        condition: service_healthy
    volumes:
      - ./backend:/app
      - ./contracts/deployments:/contracts/deployments

  # 3. React 19 Frontend Web Application
  frontend:
    image: node:22-alpine
    container_name: infosec-frontend
    working_dir: /app
    volumes:
      - ./frontend:/app
    command: sh -c "npm install && npm run dev -- --host 0.0.0.0"
    ports:
      - "5173:5173"
    depends_on:
      - backend
```

---

## 2. PRODUCTION STAGING ON FREE CLOUD TIERS
For external client demonstration or remote review:
- **Frontend**: Deployed on Vercel / Netlify (Free Tier). Static build output (`npm run build`).
- **Backend**: Deployed on Render / Railway / Fly.io (Free Tier).
- **Contracts**: Deployed to Ethereum Sepolia Testnet or Arbitrum Sepolia Testnet via free RPC (Alchemy/Infura free tier or public RPCs).

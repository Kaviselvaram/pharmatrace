# Deployment & DevOps Specification (Audited & Environment-Isolated)
**Multi-Tenant Docker Safety, Port Mapping & One-Command Local Startup**

---

## 1. DOCKER ENVIRONMENT CONSTRAINTS & MULTI-TENANT ISOLATION

### 1.1 Coexistence with Existing Docker Projects
The host machine already runs another production/staging environment (`finops`) utilizing:
- `finops-postgres-1` (listening on host port `5433`)
- `finops-minio-1` (listening on host ports `9000` & `9001`)
- Docker network: `finops_default`
- Named volumes: `finops_miniodata`, `finops_pgdata`

### 1.2 Mandatory Isolation Rules
To guarantee zero interference:
1. **Compose Project Namespace**: Always use `-p infosecproj`.
2. **Never Run Global Cleanup**:
   - ❌ FORBIDDEN: `docker system prune`, `docker volume prune`, `docker network prune`.
   - ❌ FORBIDDEN: Unscoped `docker compose down`.
   - ✅ ALLOWED: `docker compose -p infosecproj down` (only removes infosecproj containers).
3. **No Hardcoded Container Names**: Avoid static `container_name: ...` to let Compose handle clean namespacing.
4. **Unique Volume Names**: Prefix all volumes with `infosecproj_`.

---

## 2. PORT MAPPING TABLE

| Service | Container Port | Dedicated Host Port | Collision Status |
| :--- | :---: | :---: | :--- |
| **Frontend UI (React/Vite)** | `80` (or `5173`) | **`5174`** | ✅ Free (Avoids 5173 / 3000) |
| **Backend API (FastAPI)** | `8000` | **`8001`** | ✅ Free (Avoids 8000 / 8080) |
| **Local EVM (Hardhat)** | `8545` | **`8546`** | ✅ Free (Avoids 8545 default) |
| **Database (Optional Postgres)**| `5432` | **`5434`** | ✅ Free (Avoids finops `5433` and default `5432`) |

---

## 3. AUDITED `docker-compose.yml` SPECIFICATION

```yaml
version: '3.8'

networks:
  infosecproj_net:
    driver: bridge

volumes:
  infosecproj_db_data:
  infosecproj_chain_data:

services:
  # 1. Local Hardhat EVM Node
  blockchain:
    image: node:22-alpine
    working_dir: /contracts
    volumes:
      - ./contracts:/contracts
      - infosecproj_chain_data:/root/.hardhat
    command: sh -c "npm install && npx hardhat node --hostname 0.0.0.0 --port 8545"
    ports:
      - "8546:8545"
    networks:
      - infosecproj_net
    healthcheck:
      test: ["CMD", "nc", "-z", "localhost", "8545"]
      interval: 3s
      timeout: 3s
      retries: 5

  # 2. FastAPI Backend & Simulation Engine
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - RPC_URL=http://blockchain:8545
      - DB_URL=sqlite:////app/data/infosecproj.db
      - GEMINI_API_KEY=${GEMINI_API_KEY:-}
      - HOST_PORT=8000
    ports:
      - "8001:8000"
    volumes:
      - ./backend:/app
      - infosecproj_db_data:/app/data
    networks:
      - infosecproj_net
    depends_on:
      blockchain:
        condition: service_healthy

  # 3. React Frontend Web Application
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      - VITE_API_URL=http://localhost:8001
      - VITE_WS_URL=ws://localhost:8001/ws/telemetry
    ports:
      - "5174:80"
    networks:
      - infosecproj_net
    depends_on:
      - backend
```

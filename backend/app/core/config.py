"""
Configuration Settings for FastAPI Backend Gateway.
CBS3002 Information Security Project - Kaviselvaram & Aniesh S
"""

import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Pharma Cold-Chain Cryptographic Traceability Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Port and host settings (Default container port 8000 -> Host port 8001)
    HOST: str = "0.0.0.0"
    PORT: int = int(os.getenv("PORT", "8001"))

    # Local EVM RPC URL (Default localhost:8546, Docker: http://blockchain:8545)
    RPC_URL: str = os.getenv("RPC_URL", "http://127.0.0.1:8546")

    # Local SQLite database path (ensures zero collision with other Docker projects)
    DB_URL: str = os.getenv("DB_URL", "sqlite+aiosqlite:///./data/infosecproj.db")

    # Contracts deployment file path
    DEPLOYMENTS_FILE: str = os.getenv(
        "DEPLOYMENTS_FILE",
        os.path.join(os.path.dirname(__file__), "../../../contracts/deployments/local.json")
    )

    # Optional Gemini AI API Key
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # CORS configuration
    CORS_ORIGINS: list[str] = ["*"]

    model_config = {
        "env_file": ".env",
        "extra": "allow"
    }


settings = Settings()

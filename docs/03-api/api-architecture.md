# API Architecture & OpenAPI Specifications

---

## 1. API DESIGN PRINCIPLES
- **RESTful Endpoints**: Predictable, resource-oriented URIs prefixed by `/api/v1/`.
- **Strict Validation**: All incoming requests validated via Pydantic v2 schemas.
- **WebSocket Streaming**: High-throughput, bi-directional event distribution under `/ws/telemetry`.
- **Structured Error Responses**: Standardized JSON error schema with RFC 7807 compliance.

---

## 2. STANDARDIZED RESPONSE SCHEMAS

### Success Response:
```json
{
  "success": true,
  "data": { ... },
  "metadata": {
    "timestamp": 1772798400,
    "blockHeight": 142,
    "version": "1.0.0"
  }
}
```

### Error Response:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_SIGNATURE",
    "message": "The provided ECDSA signature does not correspond to the registered batch custodian.",
    "details": {
      "expectedSigner": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      "recoveredSigner": "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
    }
  }
}
```

---

## 3. OPENAPI / SWAGGER INTEGRATION
FastAPI automatically generates interactive Swagger documentation at `http://127.0.0.1:8000/docs` and OpenAPI JSON at `http://127.0.0.1:8000/openapi.json`.

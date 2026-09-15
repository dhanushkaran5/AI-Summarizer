# Summarize AI — Production Deployment Guide

This guide covers production deployment options for the **Summarize AI** platform, including Docker Compose, Kubernetes, Reverse Proxy configuration, and environment variables.

---

## 🐳 Option 1: Docker Compose (Recommended for Quick Production)

The repository provides a complete [docker-compose.yml](file:///c:/Users/Dhanushkaran%20M/Desktop/AI%20Summarizer/docker-compose.yml) orchestrating all services:

- **Frontend**: Vite / Nginx SPA on port `80` (mapped to `80:80`)
- **Backend API**: Spring Boot 3 on port `8080` (mapped to `8080:8080`)
- **AI Microservice**: FastAPI Python on port `8000` (mapped to `8000:8000`)
- **PostgreSQL**: Relational database on port `5432` with volume persistence
- **Redis**: Caching and async job queue on port `6379`

### Launching the Stack

```bash
# 1. Clone the repository and copy environment configuration
cp .env.example .env

# 2. Build and launch all containers in detached mode
docker-compose up -d --build

# 3. Verify container health status
docker-compose ps
```

---

## ☸️ Option 2: Kubernetes Deployment

For high-scale enterprise clusters, use Kubernetes deployments with Horizontal Pod Autoscalers (HPA).

### Sample AI Microservice Deployment (`k8s/ai-service-deployment.yaml`)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: summarize-ai-service
  labels:
    app: ai-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ai-service
  template:
    metadata:
      labels:
        app: ai-service
    spec:
      containers:
      - name: ai-service
        image: summarizeai/ai-service:latest
        ports:
        - containerPort: 8000
        env:
        - name: WORKERS
          value: "4"
        - name: AI_PROVIDER
          value: "mock" # Or "gemini" / "openai"
        resources:
          requests:
            cpu: "500m"
            memory: "512Mi"
          limits:
            cpu: "2000m"
            memory: "2048Mi"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 15
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
```

---

## 🛡️ Nginx Reverse Proxy with TLS/SSL

```nginx
server {
    listen 80;
    server_name summarize.yourcompany.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name summarize.yourcompany.com;

    ssl_certificate /etc/letsencrypt/live/summarize.yourcompany.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/summarize.yourcompany.com/privkey.pem;

    # Frontend Single Page App
    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend Spring Boot API
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50M;
    }

    # WebSocket / RAG Streaming
    location /ws/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }
}
```

---

## 🔑 Key Environment Variables

| Variable | Default | Description |
| :--- | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | `dev` | Profile (`dev` for H2 file DB, `prod` for PostgreSQL) |
| `SPRING_DATASOURCE_URL` | `jdbc:h2:file:./data/intellidoc` | PostgreSQL or H2 JDBC database connection URL |
| `JWT_SECRET` | *(Generated random)* | Base64-encoded secret key for signing auth tokens |
| `AI_SERVICE_URL` | `http://localhost:8000` | Target URL of the FastAPI AI/NLP microservice |
| `AI_PROVIDER` | `mock` | Active LLM engine (`mock`, `gemini`, `openai`) |
| `GEMINI_API_KEY` | *(Empty)* | Google Gemini API key (optional for cloud model) |
| `OPENAI_API_KEY` | *(Empty)* | OpenAI API key (optional for cloud model) |
| `UPLOAD_DIR` | `./uploads` | Local filesystem directory for ingested documents |

---

## 🩺 Health & Observability Endpoints

- **Spring Boot Backend**:
  - `GET /health` — Observability health check (Returns `{ status: "UP" }`).
  - `GET /ready` — Readiness probe verifying database and AI connectivity.
- **FastAPI AI Microservice**:
  - `GET /health` — Microservice liveness and loaded model check.

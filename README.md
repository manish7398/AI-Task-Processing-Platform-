# MERN AI Task Processing Platform

A production-ready AI Task Processing Platform built with MERN stack (MongoDB, Express, React, Node.js) with Python worker, Docker, Kubernetes, and GitOps with Argo CD.

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Quick Start](#quick-start)
5. [Environment Setup](#environment-setup)
6. [Docker Compose](#docker-compose)
7. [API Endpoints](#api-endpoints)
8. [Testing the API](#testing-the-api)
9. [ Kubernetes Deployment](#kubernetes-deployment)
10. [Argo CD Setup](#argo-cd-setup)
11. [CI/CD](#cicd)
12. [Project Structure](#project-structure)
13. [Requirements Met](#requirements-met)

---

## Features

- User registration and login (JWT authentication)
- Create AI tasks (title, input text, operation)
- Run tasks asynchronously in background
- Track task status (pending, running, success, failed)
- View task logs and results
- Worker auto-scaling with HPA
- GitOps deployment with Argo CD

---

## Tech Stack

| Component | Technology |
|-----------|-------------|
| Frontend | React + Vite + Nginx |
| Backend | Node.js + Express |
| Database | MongoDB (Atlas) |
| Queue | Redis |
| Worker | Python |
| Container | Docker + Docker Compose |
| Orchestration | Kubernetes (k3s) |
| GitOps | Argo CD |
| CI/CD | GitHub Actions |

---

## Prerequisites

- Node.js 20+
- Python 3.12+
- Docker & Docker Compose
- kubectl (for Kubernetes)
- MongoDB Atlas account (or local MongoDB)
- Git

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/mern-prodl1.git
cd mern-prodl1
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# .env
MONGODB_URI=mongodb://username:password@cluster.mongodb.net/database?options
JWT_SECRET=your-super-secret-key-change-in-production
```

Or use the backend `.env` file:
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your values
```

### 3. Start with Docker Compose

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up --build -d
```

### 4. Access the Application

| Service | URL |
|--------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| Redis | localhost:6379 |

---

## Environment Setup

### Backend Environment Variables

Create `backend/.env`:

```bash
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
NODE_ENV=production
ALLOWED_ORIGIN=http://localhost:3000
REDIS_URL=redis://redis:6379
```

### Frontend Environment Variables

Create `frontend/.env`:

```bash
VITE_API_URL=http://localhost:5000
```

---

## Docker Compose

### Build and Run

```bash
# Build all images
docker-compose build

# Start all services
docker-compose up

# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Individual Services

```bash
# Start only frontend
docker-compose up frontend

# Start only backend
docker-compose up backend

# Start only worker
docker-compose up worker

# Start only redis
docker-compose up redis
```

### Scale Workers

```bash
# Scale worker to 5 replicas
docker-compose up -d --scale worker=5
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|-------------|
| POST | /api/auth/register | Register new user | `{"username":"user","email":"email@test.com","password":"pass123"}` |
| POST | /api/auth/login | Login user | `{"email":"email@test.com","password":"pass123"}` |

### Tasks (Requires JWT Token)

| Method | Endpoint | Description | Headers |
|--------|----------|-------------|---------|
| POST | /api/tasks | Create task | `Authorization: Bearer <token>` |
| GET | /api/tasks | Get all tasks | `Authorization: Bearer <token>` |
| GET | /api/tasks/:id | Get task by ID | `Authorization: Bearer <token>` |

### Task Request Body

```json
{
  "title": "My AI Task",
  "inputText": "hello world",
  "operation": "uppercase"
}
```

### Supported Operations

- `uppercase` - Convert to uppercase
- `lowercase` - Convert to lowercase
- `reverse` - Reverse the string
- `wordcount` - Count words

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | / | API info |

---

## Testing the API

### Using cURL

```bash
# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@test.com","password":"test123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# Create task (replace TOKEN with actual token)
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"title":"Test","inputText":"hello","operation":"uppercase"}'

# Get all tasks
curl http://localhost:5000/api/tasks \
  -H "Authorization: Bearer TOKEN"
```

### Using Postman/Insomnia

1. Import the endpoints above
2. Set Content-Type: application/json
3. Add JWT token to Authorization header after login

---

## Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (k3s, minikube, or cloud)
- kubectl configured

### Deploy using Kustomize

```bash
# Apply all manifests
kubectl apply -k k8s/

# Or apply individually
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
kubectl apply -f k8s/worker.yaml
kubectl apply -f k8s/ingress.yaml
```

### Check Deployment Status

```bash
# List pods
kubectl get pods -n mern-ai-tasks

# View logs
kubectl logs -n mern-ai-tasks -l app=backend

# Describe deployment
kubectl describe deployment backend -n mern-ai-tasks
```

### Scale Workers

```bash
# Scale worker to 5 replicas
kubectl scale deployment worker --replicas=5 -n mern-ai-tasks
```

---

## Argo CD Setup

### 1. Install Argo CD

```bash
# Create namespace
kubectl create namespace argocd

# Install Argo CD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

### 2. Get Initial Password

```bash
# Get admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# Or use argocd CLI
argocd admin initial-password -n argocd
```

### 3. Access Argo CD

```bash
# Port forward to Argo CD server
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

Then access at: https://localhost:8080

### 4. Register Repository

1. Login to Argo CD UI
2. Click "Repositories" → "Connect Repo"
3. Enter your GitHub repository URL and credentials

### 5. Create Application

```bash
# Apply the Application CRD
kubectl apply -f k8s/argocd-application.yaml
```

### 6. View in Argo CD Dashboard

![Argo CD Dashboard](docs/argocd-dashboard.png)

---

## CI/CD

The GitHub Actions workflow (`.github/workflows/ci-cd.yml`) handles:

1. **Lint** - Code quality checks
2. **Build** - Docker image builds
3. **Push** - Push to Docker Hub
4. **Update** - Update Kubernetes manifests
5. **Sync** - Argo CD auto-syncs

### GitHub Secrets Required

- `DOCKER_USERNAME` - Docker Hub username
- `DOCKER_PASSWORD` - Docker Hub password
- `GIT_TOKEN` - GitHub token for updating manifests

---

## Project Structure

```
mern-prodl1/
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   └── context/     # React context
│   ├── Dockerfile
│   └── nginx.conf
├── backend/               # Node.js API
│   ├── src/
│   │   ├── controllers/# Route handlers
│   │   ├── models/     # Mongoose models
│   │   ├── routes/    # Express routes
│   │   ├── middleware/# Auth middleware
│   │   └── config/    # Configuration
│   ├── Dockerfile
│   └── package.json
├── worker/                # Python worker
│   ├── src/
│   │   ├── main.py    # Worker entry point
│   │   └── processor.py # Task processor
│   └── Dockerfile
├── k8s/                  # Kubernetes manifests
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secrets.yaml
│   ├── redis.yaml
│   ├── backend.yaml
│   ├── frontend.yaml
│   ├── worker.yaml
│   ├── ingress.yaml
│   └── kustomization.yaml
├── docker-compose.yml
├── .env
├── README.md
└── docs/
    └── ARCHITECTURE.md
```

---

## Requirements Met

| Requirement | Status |
|-------------|--------|
| Separate Dockerfile (frontend, backend, worker) | ✅ |
| Multi-stage builds | ✅ |
| Non-root user in containers | ✅ |
| docker-compose for local development | ✅ |
| Kubernetes namespace | ✅ |
| Deployment + Service | ✅ |
| Ingress configuration | ✅ |
| ConfigMaps + Secrets | ✅ |
| Resource limits | ✅ |
| Liveness + Readiness probes | ✅ |
| Worker scaling (HPA) | ✅ |
| Argo CD configuration | ✅ |
| CI/CD pipeline | ✅ |
| bcrypt password hashing | ✅ |
| JWT authentication | ✅ |
| Helmet middleware | ✅ |
| Rate limiting | ✅ |

---

## Architecture Document

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture including:

- Worker scaling strategy
- High volume handling (100k tasks/day)
- Database indexing
- Redis failure handling
- Staging/production setup

---

## License

MIT
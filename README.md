# MERN AI Task Processing Platform - Infrastructure Repository

This repository contains Kubernetes manifests and deployment configuration for the MERN AI Task Processing Platform.

## Repository Structure

```
mern-infrastructure/
├── k8s/
│   ├── namespace.yaml         # Kubernetes namespace
│   ├── configmap.yaml         # Application configuration
│   ├── secrets.yaml           # Secrets (encrypted in production)
│   ├── redis.yaml             # Redis deployment & service
│   ├── backend.yaml           # Backend API deployment & service
│   ├── frontend.yaml          # Frontend deployment & service
│   ├── worker.yaml             # Worker deployment + HPA
│   ├── ingress.yaml           # Ingress configuration
│   └── kustomization.yaml     # Kustomize configuration
├── docs/
│   ├── ARCHITECTURE.md        # Architecture documentation
│   ├── INFRASTRUCTURE_SETUP.md # Setup guide
│   ├── ARGO_CD_SCREENSHOTS.md  # Argo CD screenshot guide
│   └── DEPLOYMENT.md          # Deployment guide
└── README.md                  # This file
```

## Quick Start

### Prerequisites

- Kubernetes cluster (v1.20+)
- kubectl configured
- Argo CD installed

### Install Argo CD

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

### Deploy Application

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

### Check Deployment

```bash
# List all pods
kubectl get pods -n mern-ai-tasks

# View logs
kubectl logs -n mern-ai-tasks -l app=backend

# Describe deployment
kubectl describe deployment backend -n mern-ai-tasks
```

## Components

### Namespace
- Name: `mern-ai-tasks`

### Services
| Service | Port | Replicas |
|---------|------|----------|
| Frontend | 80 | 1 |
| Backend | 5000 | 1 |
| Redis | 6379 | 1 |
| Worker | - | 2-10 (HPA) |

### Worker Scaling
- Min replicas: 2
- Max replicas: 10
- Auto-scales based on CPU utilization (70%)

## Argo CD Integration

### Install Application CRD

```bash
kubectl apply -f k8s/argocd-application.yaml
```

### Access Argo CD

```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

Open: https://localhost:8080

### Login Credentials

```bash
# Get password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# Default username: admin
```

## GitOps Workflow

1. Push code to main branch
2. CI/CD builds Docker images
3. Image tags updated in this repo
4. Argo CD syncs automatically

## Environment Configuration

### ConfigMap (mern-config)
```yaml
NODE_ENV: production
REDIS_URL: redis://redis-service:6379
MONGODB_DB: aitasks
```

### Secrets (mern-secret)
```yaml
JWT_SECRET: your-jwt-secret
MONGODB_URI: mongodb+srv://...
```

## Resource Limits

| Component | CPU Request | CPU Limit | Memory |
|-----------|-------------|------------|--------|
| Frontend | 50m | 100m | 64Mi-128Mi |
| Backend | 100m | 200m | 128Mi-256Mi |
| Worker | 100m | 200m | 128Mi-256Mi |
| Redis | 50m | 100m | 64Mi-128Mi |

## Troubleshooting

### Pod not starting
```bash
kubectl describe pod <pod-name> -n mern-ai-tasks
kubectl logs <pod-name> -n mern-ai-tasks
```

### Service not accessible
```bash
kubectl get svc -n mern-ai-tasks
kubectl describe svc <service-name> -n mern-ai-tasks
```

### Argo CD sync issues
```bash
argocd app sync mern-ai-tasks
argocd app get mern-ai-tasks
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Infrastructure Setup](docs/INFRASTRUCTURE_SETUP.md)
- [Argo CD Screenshots](docs/ARGO_CD_SCREENSHOTS.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## License

MIT
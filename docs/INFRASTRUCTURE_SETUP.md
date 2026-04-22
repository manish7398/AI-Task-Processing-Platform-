# Infrastructure Repository Setup Guide

This guide explains how to set up the infrastructure repository for GitOps deployment with Argo CD.

## Overview

The infrastructure repository contains:
- Kubernetes manifests
- Kustomize configurations
- Argo CD Application definitions

## Repository Structure

```
mern-infrastructure/
├── k8s/
│   ├── base/
│   │   ├── namespace.yaml
│   │   ├── configmap.yaml
│   │   └── secrets.yaml
│   ├── overlays/
│   │   ├── staging/
│   │   │   └── kustomization.yaml
│   │   └── production/
│   │       └── kustomization.yaml
│   ├── services/
│   │   ├── redis.yaml
│   │   ├── backend.yaml
│   │   ├── frontend.yaml
│   │   └── worker.yaml
│   └── ingress.yaml
└── argocd/
    └── application.yaml
```

## Setup Steps

### 1. Create GitHub Repository

1. Go to GitHub.com → New Repository
2. Name: `mern-infrastructure`
3. Description: Kubernetes manifests for MERN AI Task Platform
4. Select: Public
5. Click: Create Repository

### 2. Clone and Add Files

```bash
git clone https://github.com/yourusername/mern-infrastructure.git
cd mern-infrastructure

# Copy k8s files from main project
cp -r ../mern-prodl1/k8s ./k8s

git add .
git commit -m "Initial Kubernetes manifests"
git push origin main
```

### 3. Connect to Argo CD

```bash
# Port forward to Argo CD
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Login via CLI
argocd login localhost:8080
```

### 4. Add Repository to Argo CD

1. Open https://localhost:8080
2. Login with admin credentials
3. Go to Settings → Repositories → Connect Repo
4. Enter:
   - Type: Git
   - Repository URL: https://github.com/yourusername/mern-infrastructure
   - Username: your-github-username
   - Password: your-github-token

### 5. Create Application in Argo CD

```yaml
# argocd/application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: mern-ai-tasks
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/yourusername/mern-infrastructure
    targetRevision: main
    path: k8s
  destination:
    server: https://kubernetes.default.svc
    namespace: mern-ai-tasks
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

Apply:
```bash
kubectl apply -f argocd/application.yaml
```

### 6. View Application

In Argo CD UI:
1. You should see "mern-ai-tasks" application
2. Sync status should show all resources
3. Click on app to see each service status

---

## Argo CD Screenshots Guide

### Screenshot 1: Dashboard Overview

After logging in, you should see:
- All applications listed
- Sync status (Synced/OutOfSync)
- Health status (Healthy/Degraded)

### Screenshot 2: Application Details

Click on "mern-ai-tasks" to see:
- Resource tree (pods, services, deployments)
- Sync history
- Rollback option

### Screenshot 3: Deployment Status

Shows:
- Frontend: Running
- Backend: Running
- Worker: Running (2 replicas)
- Redis: Running

---

## Automating Updates

### Option 1: GitHub Actions (Already configured)

When code is pushed to main repo:
1. GitHub Action builds Docker images
2. Images pushed to registry
3. Image tags updated in this repo
4. Argo CD auto-syncs

### Option 2: Manual Sync

```bash
# Sync specific app
argocd app sync mern-ai-tasks

# Sync with resources
argocd app sync mern-ai-tasks --resource backend:Deployment/backend
```

---

## Secrets Management

### For Production

1. Create secrets in repo (encrypted):
```bash
# Using SOPS
sops --encrypt k8s/secrets.yaml > k8s/secrets.enc.yaml
```

2. Or use external secrets operator:
```bash
kubectl apply -f https://raw.githubusercontent.com/external-secrets/external-secrets/latest/crds/externalsecrets.yaml
```

---

## Troubleshooting

### Check Application Status

```bash
argocd app get mern-ai-tasks
```

### View Logs

```bash
argocd app logs mern-ai-tasks
```

### Rollback

```bash
argocd app rollback mern-ai-tasks 1
```

### Sync Options

```bash
# Force sync
argocd app sync mern-ai-tasks --force

# Dry run
argocd app sync mern-ai-tasks --dry-run
```
# Deployment Guide - Live URL Setup

## Options for Live Deployment

### Option 1: Cloud Platforms (Recommended)

| Platform | Free Tier | Setup Time |
|----------|----------|------------|
| Render | Yes | 10 min |
| Railway | Yes | 10 min |
| Fly.io | Yes | 15 min |
| AWS ECS | Limited | 30 min |
| Google Cloud Run | $300 credit | 20 min |

---

## Option 1: Render.com (Easiest)

### Steps:

1. **Create Account**
   - Go to render.com
   - Sign up with GitHub

2. **Deploy Each Service**

   **Backend:**
   - New → Web Service
   - Connect: your-mern-prodl1 repo
   - Root directory: `backend`
   - Build command: `npm install`
   - Start command: `node src/server.js`
   - Env vars: Add from backend/.env

   **Frontend:**
   - New → Static Site
   - Connect: your-mern-prodl1 repo
   - Root directory: `frontend`
   - Build command: `npm run build`
   - Output directory: `dist`

   **Worker:**
   - New → Background Worker
   - Connect: your repo
   - Root directory: `worker`
   - Build command: `pip install -r requirements.txt`
   - Start command: `python src/main.py`

3. **Deploy Redis & MongoDB**
   - Add-ons → Redis (or use external)
   - Use MongoDB Atlas (free tier)

---

## Option 2: Railway

### Steps:

1. **Create Account**
   - Go to railway.app
   - Sign up with GitHub

2. **Deploy**
   - New Project → From GitHub repo
   - Select services to deploy
   - Add environment variables

3. **Setup Redis**
   - Add plugin → Redis
   - Note the connection URL

4. **Setup MongoDB**
   - Use MongoDB Atlas free tier
   - Get connection string

---

## Option 3: Kubernetes (Production)

### Using k3s on Cloud

#### DigitalOcean k3s

```bash
# Create droplet
doctl kubernetes cluster create mern-cluster \
  --region nyc1 \
  --node-pool name=worker;size=s-2vcpu-4gb;count=3
```

#### Google GKE

```bash
# Create cluster
gcloud container clusters create mern-cluster \
  --zone us-central1 \
  --num-nodes=3 \
  --machine-type=e2-medium
```

---

## Environment Variables for Production

### Backend
```bash
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=generate-secure-random-string
JWT_EXPIRE=7d
NODE_ENV=production
ALLOWED_ORIGIN=https://your-domain.com
REDIS_URL=redis://redis-host:6379
```

### Frontend
```bash
VITE_API_URL=https://api.your-domain.com
```

---

## SSL/HTTPS Setup

### Using Let's Encrypt (Ingress)

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: mern-ingress
  annotations:
    cert-manager.io/issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - your-domain.com
    secretName: mern-tls
  rules:
  - host: your-domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
```

---

## Domain Configuration

### Buy Domain

- Namecheap ($10/year)
- GoDaddy ($12/year)
- Cloudflare ($8/year)

### Point to Deployment

1. Get IP/hostname from hosting
2. Update DNS records:
   - A record: @ → your-ip
   - CNAME: www → your-domain.com

---

## Testing Deployment

```bash
# Health check
curl https://your-domain.com/health

# API test
curl -X POST https://api.your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"test123"}'
```

---

## CI/CD for Production

### GitHub Actions Auto-Deploy

1. Add secrets to GitHub:
   - `RENDER_API_KEY`
   - `RAILWAY_TOKEN`

2. Update workflow to trigger deploy on push

---

## Monitoring

### Logs
```bash
# Docker
docker-compose logs -f

# Kubernetes
kubectl logs -n mern-ai-tasks -l app=backend

# Argo CD
argocd app logs mern-ai-tasks
```

### Health Checks
- Frontend: https://your-domain.com/health
- Backend: https://api.your-domain.com/health

---

## Live URL Setup Summary

For assignment submission:
1. Use Render.com (free, easy)
2. Deploy all 3 services
3. Add MongoDB Atlas
4. Point domain or use provided URL
5. Document in README
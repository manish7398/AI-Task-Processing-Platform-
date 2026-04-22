# MERN AI Task Processing Platform - Architecture Document

## 1. System Overview

This document describes the architecture of an AI Task Processing Platform built using MERN stack (MongoDB, Express, React, Node.js) with Python worker, Redis queue, and Kubernetes deployment using GitOps with Argo CD.

## 2. Architecture Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend  │────▶│  MongoDB  │
│   (React)  │     │  (Node)   │     │ Database  │
└─────────────┘     └──────┬──────┘     └─────────────┘
                          │
                     ┌────▼────┐
                     │  Redis  │
                     │  Queue  │
                     └────┬────┘
                          │
                   ┌──────▼──────┐
                   │  Worker   │
                   │ (Python)  │
                   └──────────┘
```

## 3. Component Architecture

### 3.1 Frontend (React)
- **Technology**: React 18, Vite, Nginx
- **Port**: 80
- **Scaling**: Horizontal Pod Autoscaler (HPA) based on CPU/memory

### 3.2 Backend API (Node.js + Express)
- **Technology**: Node.js 20, Express 5, MongoDB, Redis
- **Port**: 5000
- **Scaling**: 2 replicas with load balancing

### 3.3 Worker Service (Python)
- **Technology**: Python 3.12, Redis
- **Scaling**: HPA with CPU utilization target

## 4. Worker Scaling Strategy

### 4.1 Horizontal Pod Autoscaler (HPA)
- **Minimum Replicas**: 2
- **Maximum Replicas**: 10
- **Scaling Metric**: CPU utilization (70% average)
- **Scaling Behavior**:
  - Scale up: After 3 minutes of high CPU
  - Scale down: After 5 minutes of low CPU

### 4.2 Queue-Based Scaling
Workers pull jobs from Redis queue using BRPOP command. When queue depth increases, workers auto-scale to handle load.

### 4.3 Implementation
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: worker-hpa
spec:
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## 5. Handling High Task Volume (100k Tasks/Day)

### 5.1 Capacity Planning
- **100k tasks/day** = ~1.16 tasks/second average
- **Peak load**: ~5-10 tasks/second
- Each worker processes ~10 tasks/minute
- **Required workers**: 1 (baseline) to 10 (peak)

### 5.2 Performance Optimization
1. **Redis Queue**: BRPOP for efficient job fetching
2. **Connection Pooling**: Redis connection reuse
3. **Batch Processing**: Process multiple tasks per worker cycle
4. **Result Caching**: Cache results in Redis

### 5.3 Queue Partitioning
For high volume, implement queue sharding:
```python
# Multiple Redis connections for different partitions
for i in range(NUM_SHARDS):
    redis_client = Redis(host=f'redis-shard-{i}', port=6379)
```

## 6. Database Indexing Strategy

### 6.1 MongoDB Collections
**Tasks Collection**:
```javascript
{
  userId: ObjectId,
  title: String,
  inputText: String,
  operation: String,      // indexed
  status: String,        // indexed (pending/running/success/failed)
  result: String,
  logs: String,
  createdAt: Date,      // indexed
  updatedAt: Date
}
```

**Indexes**:
```javascript
db.tasks.createIndex({ status: 1, createdAt: -1 })
db.tasks.createIndex({ userId: 1, createdAt: -1 })
db.tasks.createIndex({ operation: 1 })
db.tasks.createIndex({ result: "text" })
```

**Users Collection**:
```javascript
{
  username: String,       // unique
  email: String,        // unique indexed
  password: String,
  createdAt: Date
}
```

### 6.2 Query Optimization
- Use covered queries for task lists
- Limit result set with pagination
- Use projection to return only needed fields

## 7. Handling Redis Failure

### 7.1 Failure Scenarios
1. **Connection Timeout**: Retry with exponential backoff
2. **Server Crash**: Switch to backup Redis
3. **Network Partition**: Queue local tasks

### 7.2 High Availability
- **Redis Sentinel**: Automatic failover
- **Redis Cluster**: Data sharding
- **Backup Strategy**: Poll-based fallback

### 7.3 Implementation
```python
class QueueService:
    def __init__(self):
        self.sentinel = Sentinel([('redis1', 6379), ('redis2', 6379)])
        self.master = self.sentinel.master_for('mymaster')
    
    def get_connection(self):
        try:
            return self.master
        except:
            return self.fallback_connection()
```

## 8. Staging and Production Environments

### 8.1 Environment Separation
| Component | Staging | Production |
|----------|--------|-----------|
| Namespace | mern-staging | mern-ai-tasks |
| Database | Staging MongoDB | Production MongoDB |
| Redis | Staging Redis | Production Redis |
| Replicas | 1 | 2-10 |

### 8.2 Deployment Strategy
```yaml
# Production Kustomize
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: mern-ai-tasks
replicas:
  - name: backend
    count: 2
  - name: worker
    count: 5
```

### 8.3 GitOps Workflow
1. **Development**: PR → staging deployment
2. **Production**: Merge main → production deployment
3. **Rollback**: Argo CD rollback feature

## 9. Security Implementation

### 9.1 Authentication
- **JWT Tokens**: 7-day expiration
- **Token Storage**: HTTP-only cookies
- **Refresh Tokens**: Implemented

### 9.2 Password Security
- **bcrypt**: 12 rounds hashing
- **Salt**: Auto-generated

### 9.3 API Security
- **Helmet**: Security headers
- **Rate Limiting**: 100 requests/minute
- **CORS**: Configured origins only

### 9.4 Container Security
- **Non-root users**: All containers
- **Read-only root filesystem**: Where possible
- **Security contexts**: Configured

## 10. Resource Requirements

### 10.1 CPU and Memory
| Service | CPU Request | CPU Limit | Memory Request | Memory Limit |
|---------|-----------|----------|---------------|-------------|
| Frontend | 50m | 100m | 64Mi | 128Mi |
| Backend | 100m | 200m | 128Mi | 256Mi |
| Worker | 100m | 200m | 128Mi | 256Mi |
| Redis | 50m | 100m | 64Mi | 128Mi |

### 10.2 Storage
- **MongoDB**: 10GB persistent volume
- **Redis**: 1GB (AOF enabled)

## 11. Monitoring and Observability

### 11.1 Health Checks
- **Liveness Probe**: Container restart if failed
- **Readiness Probe**: Traffic routing only when ready

### 11.2 Logging
- **ELK Stack**: Centralized logging
- **Log Levels**: DEBUG, INFO, WARN, ERROR

### 11.3 Metrics
- **Prometheus**: Metrics collection
- **Grafana**: Visualization

## 12. Conclusion

This architecture provides:
- Scalable worker processing with HPA
- High availability with Redis Sentinel
- Efficient database queries with proper indexing
- GitOps deployment with Argo CD
- CI/CD with GitHub Actions
- Production-ready security measures
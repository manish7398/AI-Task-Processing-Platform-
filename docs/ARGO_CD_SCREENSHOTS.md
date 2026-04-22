# Argo CD Screenshots Guide

This document shows what screenshots to capture for the assignment submission.

---

## Screenshot 1: Argo CD Login

After accessing Argo CD UI (https://localhost:8080 or your-cluster-ip:443):

**Capture:**
- Login screen with username field
- Shows "Welcome to Argo CD" header

---

## Screenshot 2: Argo CD Dashboard

Shows all applications in the UI:

**Capture after login:**
- Left sidebar: Applications, Workflows, Settings
- Main area: Application cards/table
- Shows "mern-ai-tasks" application with status

**Expected items:**
- Application name
- Sync status (Synced)
- Health status (Healthy)
- Last sync time

---

## Screenshot 3: Application Tree View

Click on "mern-ai-tasks" application:

**Capture:**
- Resource tree showing:
  - Deployment (frontend)
  - Deployment (backend)  
  - Deployment (worker)
  - Service (frontend)
  - Service (backend)
  - Service (redis)
  - ConfigMap
  - Secret

**Each row shows:**
- Resource type icon
- Name
- Status (Healthy/Synced)
- Sync decision

---

## Screenshot 4: Sync History

Click on "History" tab in application:

**Capture:**
- List of past syncs
- Shows revision numbers
- Timestamps
- Who triggered (Git)

---

## Screenshot 5: Pod Logs

Click on any pod → Logs:

**Capture:**
- Worker pod logs showing task processing
- "Processing task: xxx"
- "Task completed successfully"

---

## How to Take Screenshots

### Local (Docker Desktop)

```bash
# Port forward Argo CD
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

Then open: http://localhost:8080

---

### On Cloud K8s

```bash
# Get Argo CD service IP
kubectl get svc argocd-server -n argocd
```

Use the External IP to access

---

## Screenshot Requirements Summary

| # | Screenshot | What to Capture |
|---|------------|----------------|
| 1 | Login | Argo CD login screen |
| 2 | Dashboard | All applications list |
| 3 | Resource Tree | Full k8s resources |
| 4 | Sync History | Revision history |
| 5 | Pod Logs | Worker processing |

---

## Tips

- Use keyboard: PrtScn (Windows) or Cmd+Shift+4 (Mac)
- Paste into any image editor
- Save as PNG or JPG
- Add to docs/ folder
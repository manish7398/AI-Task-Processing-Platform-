# AI Task Processing Platform - Implementation Guide

> **Note:** This is a learning project using free/open-source services only.

## Infrastructure Overview

| Component | Service | Cost |
|-----------|---------|------|
| Frontend | Vercel | Free |
| Backend API | Render | Free |
| Database | MongoDB Atlas (free tier) | Free |
| Queue/Cache | Free service options | Free |

---

## 1. Project Structure

```
Mern_ProdL1_Project/
├── frontend/              # React app (deploys to Vercel)
├── backend/               # Node.js Express API (deploys to Render)
├── worker/                # Python background worker
└── guide.md               # This guide
```

---

## 2. Backend Implementation (Node.js + Express)

### 2.1 Initialize Backend

```bash
mkdir backend && cd backend
npm init -y
npm install express mongoose jsonwebtoken bcryptjs helmet cors dotenv
npm install --save-dev nodemon
```

### 2.2 Backend Directory Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   └── taskController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   └── Task.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── taskRoutes.js
│   └── app.js
├── package.json
└── .env.example
```

### 2.3 Environment Variables (.env)

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/aitaskdb
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRE=7d
NODE_ENV=production
ALLOWED_ORIGIN=https://your-frontend.vercel.app
```

### 2.4 Key Backend Files

**src/config/db.js** - MongoDB Atlas connection:

```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Atlas connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
```

**src/models/User.js**:

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
```

**src/models/Task.js**:

```javascript
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  inputText: { type: String, required: true },
  operation: { 
    type: String, 
    required: true,
    enum: ['uppercase', 'lowercase', 'reverse', 'wordcount'] 
  },
  status: { 
    type: String, 
    enum: ['pending', 'running', 'success', 'failed'],
    default: 'pending' 
  },
  result: { type: String },
  logs: { type: String },
  error: { type: String }
}, { timestamps: true });

taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Task', taskSchema);
```

**src/controllers/authController.js**:

```javascript
const User = require('../models/User');

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }
    
    const user = await User.create({ username, email, password });
    const token = user.getSignedJwtToken();
    
    res.status(201).json({ success: true, token, user: { id: user._id, username, email } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    const token = user.getSignedJwtToken();
    res.json({ success: true, token, user: { id: user._id, username: user.username, email } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

**src/models/User.js** - Add method:

```javascript
userSchema.methods.getSignedJwtToken = function() {
  return require('jsonwebtoken').sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};
```

**src/controllers/taskController.js**:

```javascript
const Task = require('../models/Task');

exports.createTask = async (req, res) => {
  try {
    const task = new Task({
      user: req.user.id,
      title: req.body.title,
      inputText: req.body.inputText,
      operation: req.body.operation,
      status: 'pending'
    });
    
    await task.save();
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

**src/middleware/auth.js**:

```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authorized' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};
```

**src/app.js**:

```javascript
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const auth = require('./middleware/auth');

const app = express();

connectDB();

app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN,
  credentials: true
}));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/tasks', auth, taskRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Server Error' });
});

module.exports = app;
```

**src/server.js**:

```javascript
const app = require('./app');
require('dotenv').config();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

---

## 3. Frontend Implementation (React)

### 3.1 Initialize React App

```bash
npx create-react-app frontend
cd frontend
npm install axios react-router-dom
```

### 3.2 Frontend Structure

```
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── Login.js
│   │   ├── Register.js
│   │   ├── TaskList.js
│   │   ├── TaskForm.js
│   │   └── Navbar.js
│   ├── context/
│   │   └── AuthContext.js
│   ├── pages/
│   │   ├── Home.js
│   │   └── Dashboard.js
│   ├── services/
│   │   └── api.js
│   ├── App.js
│   └── index.js
├── .env
└── vercel.json
```

### 3.3 Key Frontend Files

**src/services/api.js**:

```javascript
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://your-backend.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
};

export const taskService = {
  getTasks: () => api.get('/api/tasks'),
  createTask: (data) => api.post('/api/tasks', data),
  getTaskById: (id) => api.get(`/api/tasks/${id}`),
};

export default api;
```

**src/context/AuthContext.js**:

```javascript
import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    localStorage.setItem('token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (username, email, password) => {
    const res = await authService.register({ username, email, password });
    localStorage.setItem('token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

**src/pages/Dashboard.js**:

```javascript
import React, { useState, useEffect } from 'react';
import { taskService } from '../services/api';
import TaskForm from '../components/TaskForm';
import TaskList from '../components/TaskList';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);

  const fetchTasks = async () => {
    try {
      const res = await taskService.getTasks();
      setTasks(res.data.data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleTaskCreate = async (taskData) => {
    try {
      await taskService.createTask(taskData);
      fetchTasks();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  return (
    <div>
      <h1>AI Task Dashboard</h1>
      <TaskForm onSubmit={handleTaskCreate} />
      <TaskList tasks={tasks} />
    </div>
  );
};

export default Dashboard;
```

**src/App.js**:

```javascript
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './pages/Dashboard';
import Navbar from './components/Navbar';

const PrivateRoute = ({ children }) => {
  const { token } = React.useContext(AuthContext);
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
```

**.env.example**:

```env
REACT_APP_API_URL=https://your-backend.onrender.com
```

**vercel.json**:

```json
{
  "version": 2,
  "builds": [
    { "src": "package.json", "use": "@vercel/react-build" }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "/$1" }
  ]
}
```

---

## 4. Python Worker Implementation

> **Note:** For free tier, consider polling-based approach instead of persistent Redis connection.

### 4.1 Initialize Worker

```bash
mkdir worker && cd worker
pip install pymongo python-dotenv
```

### 4.2 Worker Files

**src/processor.py**:

```python
def process_task(operation: str, input_text: str) -> dict:
    """Process task based on operation type"""
    
    if operation == 'uppercase':
        result = input_text.upper()
        logs = f"Converted to uppercase: {len(result)} characters"
    elif operation == 'lowercase':
        result = input_text.lower()
        logs = f"Converted to lowercase: {len(result)} characters"
    elif operation == 'reverse':
        result = input_text[::-1]
        logs = f"Reversed string: {len(result)} characters"
    elif operation == 'wordcount':
        result = str(len(input_text.split()))
        logs = f"Word count: {result} words"
    else:
        raise ValueError(f"Unknown operation: {operation}")
    
    return {'result': result, 'logs': logs}
```

**src/main.py**:

```python
import pymongo
import os
import time
from dotenv import load_dotenv
from processor import process_task

load_dotenv()

mongo_client = pymongo.MongoClient(os.getenv('MONGODB_URI'))
db = mongo_client['aitaskdb']
tasks_collection = db['tasks']

def process_queue():
    print("Worker started...")
    
    while True:
        try:
            task = tasks_collection.find_one_and_update(
                {'status': 'pending'},
                {'$set': {'status': 'running'}},
                return_document=True
            )
            
            if task:
                print(f"Processing task: {task['_id']}")
                try:
                    output = process_task(task['operation'], task['inputText'])
                    tasks_collection.update_one(
                        {'_id': task['_id']},
                        {'$set': {
                            'status': 'success',
                            'result': output['result'],
                            'logs': output['logs']
                        }}
                    )
                    print(f"Task {task['_id']} completed")
                except Exception as e:
                    tasks_collection.update_one(
                        {'_id': task['_id']},
                        {'$set': {
                            'status': 'failed',
                            'error': str(e)
                        }}
                    )
                    print(f"Task {task['_id']} failed: {e}")
            else:
                time.sleep(5)
                
        except Exception as e:
            print(f"Worker error: {e}")
            time.sleep(5)

if __name__ == '__main__':
    process_queue()
```

**requirements.txt**:

```
pymongo
python-dotenv
```

---

## 5. Deployment Guide

### 5.1 MongoDB Atlas Setup (Free Tier)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas) and create free account
2. Create free cluster (M0 Sandbox) in your preferred region
3. Create database user with read/write permissions
4. Add IP address `0.0.0.0/0` to whitelist (for learning)
5. Get connection string from "Connect" -> "Connect your application"

### 5.2 Backend Deployment (Render - Free Tier)

1. Go to [Render](https://render.com) and connect with GitHub
2. Create "New Web Service"
3. Connect your backend repository
4. Configure:
   - **Name:** `your-app-backend`
   - **Region:** Free tier available region
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start` (add script to package.json)
5. Add Environment Variables:
   - `MONGODB_URI` - Your Atlas connection string
   - `JWT_SECRET` - Generate a secure random string
   - `JWT_EXPIRE` - `7d`
   - `NODE_ENV` - `production`
   - `ALLOWED_ORIGIN` - Your Vercel frontend URL (after first deploy)
6. Deploy

**package.json scripts** (add):

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  }
}
```

### 5.3 Frontend Deployment (Vercel - Free Tier)

1. Go to [Vercel](https://vercel.com) and sign up with GitHub
2. Import your frontend repository
3. Configure:
   - **Framework Preset:** `Create React App`
   - **Root Directory:** `./`
4. Add Environment Variables:
   - `REACT_APP_API_URL` - Your Render backend URL
5. Deploy

**Note:** After first deploy, copy the Vercel URL (e.g., `your-app.vercel.app`) and add it to Render's `ALLOWED_ORIGIN` env var.

### 5.4 Worker Deployment

For learning, you have options:

**Option A: Use Render Free Tier (Web Service)**
- Create another Web Service for worker
- Set start command to `python src/main.py`
- Note: Free tier sleeps after 15 min inactivity

**Option B: Cron-based Worker (Simpler)**
- Instead of persistent worker, use backend to process synchronously
- Remove worker directory entirely
- Process tasks directly in `taskController.js`

**Option C: Keep it Simple - Process Synchronously**
- Move task processing to backend API
- Remove worker completely for learning

### 5.5 Simplified Approach (Recommended for Learning)

For a pure learning project without worker complexity:

**Modify src/controllers/taskController.js**:

```javascript
const Task = require('../models/Task');

const processTask = (operation, inputText) => {
  switch (operation) {
    case 'uppercase':
      return { result: inputText.toUpperCase(), logs: 'Converted to uppercase' };
    case 'lowercase':
      return { result: inputText.toLowerCase(), logs: 'Converted to lowercase' };
    case 'reverse':
      return { result: inputText.split('').reverse().join(''), logs: 'String reversed' };
    case 'wordcount':
      return { result: String(inputText.split(/\s+/).length), logs: 'Word count calculated' };
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
};

exports.createTask = async (req, res) => {
  try {
    const task = new Task({
      user: req.user.id,
      title: req.body.title,
      inputText: req.body.inputText,
      operation: req.body.operation,
      status: 'pending'
    });
    
    await task.save();
    
    const output = processTask(task.operation, task.inputText);
    task.status = 'success';
    task.result = output.result;
    task.logs = output.logs;
    await task.save();
    
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

---

## 6. Free Tier Limitations

| Service | Free Tier Limits |
|---------|-----------------|
| Vercel | 100GB bandwidth/month, serverless functions |
| Render | 15 min sleep after inactivity, shared CPU |
| MongoDB Atlas | 512MB storage, shared CPU, no backups |

**Tips for Learning:**
- Use synchronous processing (no worker needed)
- Implement polling in frontend for status updates
- Keep database queries efficient
- Use rate limiting to avoid hitting limits

---

## 7. Architecture (Simplified)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│   Vercel    │────▶│   Render   │
│  (Frontend)│◀────│  (React)   │◀────│  (API)     │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
                                       ┌─────────────┐
                                       │  MongoDB   │
                                       │   Atlas    │
                                       └─────────────┘
```

---

## 8. Testing Checklist

- [ ] User registration works
- [ ] User login works and returns JWT
- [ ] Protected routes require authentication
- [ ] Task creation works with all operations
- [ ] Tasks display in dashboard
- [ ] Frontend deploys to Vercel
- [ ] Backend deploys to Render
- [ ] CORS works between Vercel and Render
- [ ] MongoDB Atlas connection works
- [ ] Environment variables configured securely

---

## 9. Learning Resources

| Topic | Resource |
|-------|----------|
| React | [React Docs](https://react.dev) |
| Express | [Express Guide](https://expressjs.com) |
| MongoDB | [MongoDB University](https://learn.mongodb.com) |
| Vercel | [Vercel Docs](https://vercel.com/docs) |
| Render | [Render Docs](https://render.com/docs) |
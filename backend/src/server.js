require('dotenv').config();
const mongoose = require('mongoose');
const Redis = require('ioredis');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { addToQueue } = require('./services/queueService');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const auth = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    console.log('MongoDB connected');
    
    const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    redis.on('connect', () => console.log('Redis connected'));
    redis.on('error', (err) => console.error('Redis error:', err.message));
    
    app.use(helmet());
    app.use(cors({
      origin: process.env.ALLOWED_ORIGIN || '*',
      credentials: true
    }));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    const limiter = rateLimit({
      windowMs: 60 * 1000,
      max: 100,
      message: { success: false, error: 'Too many requests, please try again later' }
    });
    app.use('/api/', limiter);

    app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    app.get('/', (req, res) => {
      res.json({ message: 'API is running', endpoints: ['/api/auth', '/api/tasks', '/health'] });
    });

    app.use('/api/auth', authRoutes);
    app.use('/api/tasks', auth, taskRoutes);

    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({ success: false, error: 'Server Error' });
    });

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
};

startServer();
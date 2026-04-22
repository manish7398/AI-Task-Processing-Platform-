require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const connectDB = require('./config/db');
const { connectRedis } = require('./services/queueService');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const auth = require('./middleware/auth');

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "http://localhost:5000", "http://localhost:3000"],
    }
  }
}));
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());

const startServer = async () => {
  await connectDB();
  await connectRedis();

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
};

startServer();

module.exports = app;
const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redis;

const connectRedis = async () => {
  redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100
  });

  redis.on('connect', () => {
    console.log('Redis connected');
  });

  redis.on('error', (err) => {
    console.error('Redis error:', err.message);
  });

  await redis.ping();
  return redis;
};

const getRedis = async () => {
  if (!redis) {
    return await connectRedis();
  }
  return redis;
};

const TASK_QUEUE = 'task:queue';

const addToQueue = async (task) => {
  const redis = await getRedis();
  const taskData = JSON.stringify(task);
  await redis.rpush(TASK_QUEUE, taskData);
  console.log(`Task ${task._id} added to queue`);
};

const getFromQueue = async () => {
  const redis = await getRedis();
  const taskData = await redis.lpop(TASK_QUEUE);
  if (taskData) {
    return JSON.parse(taskData);
  }
  return null;
};

const getQueueLength = async () => {
  const redis = await getRedis();
  return await redis.llen(TASK_QUEUE);
};

module.exports = {
  connectRedis,
  getRedis,
  addToQueue,
  getFromQueue,
  getQueueLength,
  TASK_QUEUE
};
const Task = require('../models/Task');
const Redis = require('ioredis');

const getRedis = () => new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

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
    
    const redis = getRedis();
    const taskData = JSON.stringify({
      _id: task._id.toString(),
      operation: task.operation,
      inputText: task.inputText
    });
    await redis.rpush('task:queue', taskData);
    await redis.quit();
    
    console.log(`Task ${task._id} added to queue`);
    
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    console.error('Create task error:', error);
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
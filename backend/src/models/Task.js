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
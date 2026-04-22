import { useState, useEffect } from 'react';
import { taskService } from '../services/api';
import TaskForm from '../components/TaskForm';
import TaskList from '../components/TaskList';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const res = await taskService.getTasks();
      setTasks(res.data.data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 2000);
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

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <h1>AI Task Dashboard</h1>
      <div className="dashboard-content">
        <TaskForm onSubmit={handleTaskCreate} />
        <TaskList tasks={tasks} />
      </div>
    </div>
  );
};

export default Dashboard;
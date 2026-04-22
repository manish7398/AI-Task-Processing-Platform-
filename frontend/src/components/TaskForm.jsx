import { useState } from 'react';

const TaskForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    inputText: '',
    operation: 'uppercase'
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      setFormData({ title: '', inputText: '', operation: 'uppercase' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <h3>Create New Task</h3>
      <div className="form-group">
        <label>Title</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Enter task title"
          required
        />
      </div>
      <div className="form-group">
        <label>Input Text</label>
        <textarea
          name="inputText"
          value={formData.inputText}
          onChange={handleChange}
          placeholder="Enter text to process"
          required
        />
      </div>
      <div className="form-group">
        <label>Operation</label>
        <select name="operation" value={formData.operation} onChange={handleChange}>
          <option value="uppercase">UPPERCASE</option>
          <option value="lowercase">lowercase</option>
          <option value="reverse">Reverse</option>
          <option value="wordcount">Word Count</option>
        </select>
      </div>
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Task'}
      </button>
    </form>
  );
};

export default TaskForm;
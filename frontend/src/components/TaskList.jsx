const TaskList = ({ tasks }) => {
  const getStatusClass = (status) => {
    return `status-${status}`;
  };

  return (
    <div className="task-list">
      <h3>Your Tasks</h3>
      {tasks.length === 0 ? (
        <p>No tasks yet. Create one above!</p>
      ) : (
        <div className="tasks-container">
          {tasks.map((task) => (
            <div key={task._id} className="task-card">
              <div className="task-header">
                <h4>{task.title}</h4>
                <span className={`status ${getStatusClass(task.status)}`}>
                  {task.status}
                </span>
              </div>
              <div className="task-body">
                <p><strong>Input:</strong> {task.inputText}</p>
                {task.result && (
                  <p><strong>Result:</strong> {task.result}</p>
                )}
                <p><strong>Operation:</strong> {task.operation}</p>
                {task.error && (
                  <p className="error"><strong>Error:</strong> {task.error}</p>
                )}
              </div>
              <div className="task-footer">
                <small>{new Date(task.createdAt).toLocaleString()}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskList;
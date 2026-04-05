import React, { useState } from 'react';

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

export function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    setTasks([{ id: Date.now().toString(), title: newTask, completed: false }, ...tasks]);
    setNewTask('');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const currentTask = tasks.find(t => !t.completed);

  return (
    <div className="task-board glass-panel">
      <h3 className="section-title">CURRENT TASK</h3>
      
      {currentTask ? (
        <div className="active-task">
          <div className="task-status-dot active"></div>
          <span className="task-title">{currentTask.title}</span>
        </div>
      ) : (
        <div className="active-task empty">
          <span className="task-title">No active task</span>
        </div>
      )}

      <form onSubmit={addTask} className="task-form">
        <input 
          type="text" 
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="What are you working on?" 
          className="task-input"
        />
        <button type="submit" className="btn btn-outline btn-sm">Add</button>
      </form>

      <div className="task-list">
        {tasks.map(task => (
          <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
            <label className="task-checkbox-label">
              <input 
                type="checkbox" 
                checked={task.completed}
                onChange={() => toggleTask(task.id)}
              />
              <span className="checkbox-custom"></span>
            </label>
            <span className="task-title-list">{task.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

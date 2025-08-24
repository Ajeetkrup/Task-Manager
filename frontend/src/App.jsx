import { useState } from "react";
import "./App.css";
import { useEffect } from "react";

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "Todo",
  });

  const fetchTasks = async () => {
    try {
      const response = await fetch("http://localhost:4000/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            query {
              tasks {
                id
                name
                description
                status
                timeStamp
              }
            }
          `,
        }),
      });
      const data = await response.json();
      setTasks(data.data.tasks);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch tasks");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleAddTask = async () => {
    if (!formData.name || !formData.description) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const response = await fetch("http://localhost:4000/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            mutation {
              addTask(name: "${formData.name}", description: "${formData.description}", status: "${formData.status}") {
                id
                name
                description
                status
                timeStamp
              }
            }
          `,
        }),
      });
      const data = await response.json();
      setTasks([...tasks, data.data.addTask]);
      setFormData({ name: "", description: "", status: "Todo" });
    } catch (err) {
      setError("Failed to add task");
    }
  };

  const handleUpdateTask = async (id) => {
    const task = editingTask[id];
    try {
      const response = await fetch("http://localhost:4000/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            mutation {
              updateTask(id: "${id}", name: "${task.name}", description: "${task.description}", status: "${task.status}") {
                id
                name
                description
                status
                timeStamp
              }
            }
          `,
        }),
      });
      const data = await response.json();
      setTasks(tasks.map((t) => (t.id === id ? data.data.updateTask : t)));
      setEditingTask(null);
    } catch (err) {
      setError("Failed to update task");
    }
  };

  const handleDeleteTask = async (id) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      await fetch("http://localhost:4000/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            mutation {
              deleteTask(id: "${id}") {
                success
                message
              }
            }
          `,
        }),
      });
      setTasks(tasks.filter((t) => t.id !== id));
    } catch (err) {
      setError("Failed to delete task");
    }
  };

  const startEdit = (task) => {
    setEditingTask({
      [task.id]: { ...task },
    });
  };

  const updateEditField = (id, field, value) => {
    setEditingTask({
      ...editingTask,
      [id]: {
        ...editingTask[id],
        [field]: value,
      },
    });
  };

  if (loading) return <div className="loading">Loading tasks...</div>;

  return (
    <>
      <div className="container">
        <div className="header">
          <h1>📋 Task Manager</h1>
          <p>Manage your tasks efficiently with GraphQL</p>
        </div>

        {error && <div className="error">⚠️ {error}</div>}

        <div className="task-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Task Name</label>
              <input
                type="text"
                placeholder="Enter task name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                placeholder="Enter task description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
              >
                <option value="Todo">Todo</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
              </select>
            </div>
            <button className="btn btn-add" onClick={handleAddTask}>
              ➕ Add Task
            </button>
          </div>
        </div>

        <div className="tasks-grid">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`task-card status-${task.status
                .toLowerCase()
                .replace(" ", "-")}`}
            >
              <div className="task-header">
                <h3 className="task-title">{task.name}</h3>
                <span
                  className={`task-status status-${task.status
                    .toLowerCase()
                    .replace(" ", "-")}`}
                >
                  {task.status}
                </span>
              </div>
              <p className="task-description">{task.description}</p>

              {editingTask && editingTask[task.id] ? (
                <div className="edit-form">
                  <input
                    type="text"
                    value={editingTask[task.id].name}
                    onChange={(e) =>
                      updateEditField(task.id, "name", e.target.value)
                    }
                  />
                  <input
                    type="text"
                    value={editingTask[task.id].description}
                    onChange={(e) =>
                      updateEditField(task.id, "description", e.target.value)
                    }
                  />
                  <select
                    value={editingTask[task.id].status}
                    onChange={(e) =>
                      updateEditField(task.id, "status", e.target.value)
                    }
                  >
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                  <div className="edit-actions">
                    <button
                      className="btn btn-save"
                      onClick={() => handleUpdateTask(task.id)}
                    >
                      Save
                    </button>
                    <button
                      className="btn btn-cancel"
                      onClick={() => setEditingTask(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="task-footer">
                  <span className="task-timestamp">📅 {task.timeStamp}</span>
                  <div className="task-actions">
                    <button
                      className="btn-icon btn-edit"
                      onClick={() => startEdit(task)}
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-icon btn-delete"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default App;

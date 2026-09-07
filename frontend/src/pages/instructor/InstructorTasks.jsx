import React, { useState, useEffect } from "react";
import { CheckSquare, Plus, Trash2, Calendar, AlertCircle, X, Check } from "lucide-react";
import { tasksApi, modulesApi } from "../../api";
import { inputStyle } from "../../components/common/styles";

export function InstructorTasks() {
  const [tasks, setTasks] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [moduleId, setModuleId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [taskStatus, setTaskStatus] = useState("published");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchTasksAndModules = async () => {
    setLoading(true);
    try {
      const [tasksData, modulesData] = await Promise.all([
        tasksApi.getAll(),
        modulesApi.getAll()
      ]);
      setTasks(tasksData);
      setModules(modulesData);
      if (modulesData.length > 0) {
        setModuleId(modulesData[0]._id || modulesData[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksAndModules();
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      await tasksApi.create({
        module_id: moduleId,
        title,
        description,
        instructions,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        status: taskStatus,
        attachments: attachmentUrl ? [attachmentUrl] : []
      });

      setShowModal(false);
      setTitle("");
      setDescription("");
      setInstructions("");
      setDueDate("");
      setAttachmentUrl("");
      await fetchTasksAndModules();
    } catch (err) {
      setFormError(err.message || "Failed to create task.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await tasksApi.delete(taskId);
      setTasks(tasks.filter((t) => t.id !== taskId && t._id !== taskId));
    } catch (err) {
      alert("Failed to delete task: " + err.message);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.8rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: "700", marginBottom: "0.3rem" }} className="gradient-text">
            Task & Assignment Management
          </h1>
          <p style={{ color: "#b0c4c6", fontSize: "0.95rem" }}>
            Create homework, assignments, and tests for your enrolled students.
          </p>
        </div>

        <button onClick={() => setShowModal(true)} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Plus size={18} /> Create New Task
        </button>
      </div>

      {/* Task List */}
      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--color-primary)" }}>Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="glass-panel" style={{ padding: "3rem", textAlign: "center", color: "#888" }}>
          <CheckSquare size={40} color="var(--color-primary)" style={{ margin: "0 auto 0.8rem", opacity: 0.6 }} />
          <p style={{ fontSize: "1.1rem", fontWeight: "500" }}>No tasks created yet</p>
          <p style={{ fontSize: "0.85rem", marginTop: "0.4rem" }}>
            Click 'Create New Task' above to assign homework to your students.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.2rem" }}>
          {tasks.map((task) => (
            <div
              key={task.id}
              className="glass-panel"
              style={{
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.8rem"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <h3 style={{ fontSize: "1.15rem", fontWeight: "600", color: "#fff" }}>{task.title}</h3>
                <span
                  style={{
                    backgroundColor: task.status === "published" ? "rgba(85, 239, 196, 0.15)" : "rgba(255, 184, 108, 0.15)",
                    color: task.status === "published" ? "#55efc4" : "#ffb86c",
                    padding: "3px 8px",
                    borderRadius: "10px",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    textTransform: "capitalize"
                  }}
                >
                  {task.status}
                </span>
              </div>

              <p style={{ fontSize: "0.9rem", color: "#b0c4c6", lineHeight: "1.5" }}>{task.description}</p>

              {task.instructions && (
                <div style={{ fontSize: "0.8rem", backgroundColor: "rgba(255,255,255,0.03)", padding: "0.6rem", borderRadius: "6px", color: "#ddd" }}>
                  <strong>Instructions:</strong> {task.instructions}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: "0.6rem", borderTop: "1px solid rgba(255,255,255,0.05)", fontSize: "0.8rem", color: "#888" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <Calendar size={14} /> Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : "No deadline"}
                </span>

                <button
                  onClick={() => handleDeleteTask(task.id || task._id)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#ff7675",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    fontSize: "0.8rem"
                  }}
                  title="Delete Task"
                >
                  <Trash2 size={15} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.8)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem"
          }}
        >
          <div className="glass-panel" style={{ maxWidth: "540px", width: "100%", padding: "2rem", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: "700" }} className="gradient-text">
                Create New Task
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: "transparent", border: "none", color: "#888", cursor: "pointer" }}
              >
                <X size={22} />
              </button>
            </div>

            {formError && (
              <div
                style={{
                  backgroundColor: "rgba(255, 107, 107, 0.15)",
                  color: "#ff6b6b",
                  padding: "0.8rem",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  marginBottom: "1rem"
                }}
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateTask} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem", color: "#b0c4c6" }}>
                  Learning Module
                </label>
                <select value={moduleId} onChange={(e) => setModuleId(e.target.value)} required style={inputStyle}>
                  {modules.map((m) => (
                    <option key={m._id || m.id} value={m._id || m.id}>
                      {m.name || m.title || 'Module'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem", color: "#b0c4c6" }}>
                  Task Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vocabulary & Translation Practice 1"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem", color: "#b0c4c6" }}>
                  Description / Prompt
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief summary of the assignment requirements..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem", color: "#b0c4c6" }}>
                  Detailed Instructions (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Specific rules, submission guidelines, references..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem", color: "#b0c4c6" }}>
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem", color: "#b0c4c6" }}>
                    Status
                  </label>
                  <select value={taskStatus} onChange={(e) => setTaskStatus(e.target.value)} style={inputStyle}>
                    <option value="published">Published (Visible to Students)</option>
                    <option value="draft">Draft (Hidden)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem", color: "#b0c4c6" }}>
                  Attachment / Resource Link (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://... (Drive link, worksheet PDF)"
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary"
                style={{ marginTop: "0.5rem", padding: "14px", opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? "Publishing Task..." : "Publish Task"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, User, RefreshCw, CheckCheck, Users } from "lucide-react";
import { messagesApi } from "../../api";
import { useAuth } from "../../context/AuthContext";

export function InstructorMessages() {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsgContent, setNewMsgContent] = useState("");
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  const fetchThreads = async () => {
    try {
      const data = await messagesApi.getThreads();
      setThreads(data || []);
      if (data && data.length > 0 && !activeThread) {
        setActiveThread(data[0]);
      }
    } catch (err) {
      console.error("Error fetching threads:", err);
      setError("Failed to load student conversation threads.");
    } finally {
      setLoadingThreads(false);
    }
  };

  const fetchHistory = async (threadId) => {
    if (!threadId) return;
    setLoadingHistory(true);
    try {
      const history = await messagesApi.getHistory(threadId);
      setMessages(history || []);
      await messagesApi.markRead(threadId);
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchThreads();
    const interval = setInterval(fetchThreads, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeThread) {
      fetchHistory(activeThread._id || activeThread.id);
      const interval = setInterval(() => {
        fetchHistory(activeThread._id || activeThread.id);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [activeThread]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMsgContent.trim() || !activeThread || isSending) return;

    const threadId = activeThread._id || activeThread.id;
    const content = newMsgContent.trim();
    setNewMsgContent("");
    setIsSending(true);

    try {
      const sentMsg = await messagesApi.send({
        thread_id: threadId,
        recipient_user_id: activeThread.student_user_id,
        content: content,
      });
      setMessages((prev) => [...prev, sentMsg]);
      fetchThreads();
    } catch (err) {
      console.error("Failed to send message:", err);
      setError(err.message || "Could not send message to student.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1.5rem" }}>
      <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: "700", color: "#fff" }} className="gradient-text">
            Student Communications & Messages
          </h1>
          <p style={{ color: "#8892b0", fontSize: "0.95rem" }}>
            Respond to student questions, homework queries, and lesson feedback
          </p>
        </div>
        <button
          onClick={fetchThreads}
          className="glass-panel"
          style={{ padding: "8px 16px", color: "var(--color-primary)", display: "flex", alignItems: "center", gap: "8px", border: "1px solid var(--color-primary)" }}
        >
          <RefreshCw size={16} /> Refresh Conversations
        </button>
      </div>

      {error && <p style={{ color: "#ff6b6b", marginBottom: "1rem" }}>{error}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "1.5rem", minHeight: "550px" }}>
        {/* Left Panel: Assigned Student Threads */}
        <div className="glass-panel" style={{ padding: "1.2rem", display: "flex", flexDirection: "column" }}>
          <h3 style={{ color: "#fff", fontSize: "1.1rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <Users size={18} color="var(--color-primary)" /> Enrolled Students ({threads.length})
          </h3>

          {loadingThreads ? (
            <p style={{ color: "#8892b0", textAlign: "center", margin: "auto" }}>Loading student chats...</p>
          ) : threads.length === 0 ? (
            <p style={{ color: "#8892b0", textAlign: "center", margin: "auto", fontSize: "0.9rem" }}>
              No active student conversations found.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", overflowY: "auto", flex: 1 }}>
              {threads.map((t) => {
                const isSelected = activeThread && (activeThread._id || activeThread.id) === (t._id || t.id);
                return (
                  <div
                    key={t._id || t.id}
                    onClick={() => setActiveThread(t)}
                    style={{
                      padding: "12px",
                      borderRadius: "10px",
                      cursor: "pointer",
                      background: isSelected ? "rgba(197, 229, 232, 0.15)" : "rgba(255, 255, 255, 0.03)",
                      border: isSelected ? "1px solid var(--color-primary)" : "1px solid rgba(255, 255, 255, 0.05)",
                      transition: "all 0.2s"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontWeight: "600", color: "#fff", fontSize: "0.95rem" }}>
                        {t.student_name || "Student"}
                      </span>
                      {t.unread_count_instructor > 0 && (
                        <span style={{ background: "var(--color-primary)", color: "var(--color-bg-dark)", fontSize: "0.75rem", padding: "2px 8px", borderRadius: "10px", fontWeight: "bold" }}>
                          {t.unread_count_instructor} unread
                        </span>
                      )}
                    </div>
                    {t.student_code && (
                      <div style={{ color: "var(--color-primary)", fontSize: "0.75rem", marginBottom: "4px" }}>
                        {t.student_code}
                      </div>
                    )}
                    <p style={{ color: "#8892b0", fontSize: "0.82rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {t.last_message || "No messages yet."}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Panel: Selected Student Conversation */}
        <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", height: "600px" }}>
          {activeThread ? (
            <>
              {/* Header */}
              <div style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: "1rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--color-primary)", color: "var(--color-bg-dark)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                  <User size={20} />
                </div>
                <div>
                  <h3 style={{ color: "#fff", fontSize: "1.1rem", margin: 0 }}>
                    {activeThread.student_name || "Student"}
                  </h3>
                  <span style={{ color: "var(--color-primary)", fontSize: "0.8rem" }}>
                    Student Code: {activeThread.student_code || "N/A"}
                  </span>
                </div>
              </div>

              {/* Chat Stream */}
              <div style={{ flex: 1, overflowY: "auto", paddingRight: "8px", display: "flex", flexDirection: "column", gap: "12px" }}>
                {loadingHistory ? (
                  <p style={{ color: "#8892b0", textAlign: "center", margin: "auto" }}>Loading conversation history...</p>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: "center", margin: "auto", color: "#8892b0" }}>
                    <MessageCircle size={36} style={{ marginBottom: "8px", opacity: 0.5 }} />
                    <p>No chat history with this student yet.</p>
                    <p style={{ fontSize: "0.85rem" }}>Send a message below to reach out to the student.</p>
                  </div>
                ) : (
                  messages.map((m, idx) => {
                    const isMe = m.sender_role === "instructor" || m.sender_user_id === str(user?.id || user?._id);
                    return (
                      <div
                        key={m._id || m.id || idx}
                        style={{
                          alignSelf: isMe ? "flex-end" : "flex-start",
                          maxWidth: "70%",
                          background: isMe ? "var(--color-primary)" : "rgba(255, 255, 255, 0.08)",
                          color: isMe ? "var(--color-bg-dark)" : "#fff",
                          padding: "10px 14px",
                          borderRadius: isMe ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
                        }}
                      >
                        <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: "1.4", wordBreak: "break-word" }}>{m.content}</p>
                        <div style={{ textAlign: "right", marginTop: "4px", fontSize: "0.7rem", opacity: 0.75, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                          <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isMe && <CheckCheck size={12} />}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Send Form */}
              <form onSubmit={handleSendMessage} style={{ marginTop: "1rem", display: "flex", gap: "10px", borderTop: "1px solid rgba(255, 255, 255, 0.1)", paddingTop: "1rem" }}>
                <input
                  type="text"
                  placeholder="Type your response to student..."
                  value={newMsgContent}
                  onChange={(e) => setNewMsgContent(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    background: "rgba(0, 0, 0, 0.3)",
                    color: "#fff",
                    fontSize: "0.95rem"
                  }}
                />
                <button
                  type="submit"
                  disabled={isSending || !newMsgContent.trim()}
                  className="btn-primary"
                  style={{ padding: "12px 20px", display: "flex", alignItems: "center", gap: "6px", opacity: isSending || !newMsgContent.trim() ? 0.6 : 1 }}
                >
                  <Send size={16} /> Send Reply
                </button>
              </form>
            </>
          ) : (
            <div style={{ margin: "auto", textAlign: "center", color: "#8892b0" }}>
              <MessageCircle size={48} style={{ marginBottom: "1rem", opacity: 0.4 }} />
              <p>Select a student thread from the left to view and respond.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function str(val) {
  return val ? String(val) : "";
}

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../api";

export default function ComplaintList({ refresh }) {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [updateForm, setUpdateForm] = useState({ status: "", comment: "" });

  useEffect(() => {
    fetchComplaints();
  }, [refresh]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await API.get("/complaints");
      setComplaints(res.data.complaints);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Error fetching complaints");
      console.error("Error fetching complaints", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (complaintId) => {
    try {
      await API.put(`/complaints/${complaintId}/status`, updateForm);
      alert("Status updated successfully!");
      setUpdatingId(null);
      setUpdateForm({ status: "", comment: "" });
      fetchComplaints(); // Refresh list
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
      console.error("Update error:", err);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Raised: "#ff9800",
      Pending: "#2196f3",
      "In Progress": "#9c27b0",
      Resolved: "#4caf50",
      Closed: "#607d8b",
      Rejected: "#f44336",
    };
    return colors[status] || "#757575";
  };

  const getPriorityColor = (priority) => {
    const colors = {
      Low: "#4caf50",
      Normal: "#2196f3",
      High: "#ff9800",
      Critical: "#f44336",
    };
    return colors[priority] || "#757575";
  };

  const canUpdateComplaint = (complaint) => {
    if (user.role === "admin" || user.role === "complaint-receiver") {
      return true;
    }
    if (user.role === "tte") {
      // TTE can update if assigned to them or if unassigned
      return !complaint.assignedTo || complaint.assignedTo._id === user.id;
    }
    return false;
  };

  if (loading) return <p>Loading complaints...</p>;

  if (error) {
    return (
      <div style={{ padding: "10px", background: "#ffebee", color: "#c62828", borderRadius: "4px" }}>
        {error}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <h3>Complaints ({complaints.length})</h3>
        <button
          onClick={fetchComplaints}
          style={{ padding: "8px 15px", background: "#1976d2", color: "white", border: "none", cursor: "pointer", borderRadius: "4px" }}
        >
          Refresh
        </button>
      </div>

      {complaints.length === 0 && <p>No complaints found</p>}

      <div style={{ display: "grid", gap: "15px" }}>
        {complaints.map((c) => (
          <div
            key={c._id}
            style={{
              border: "1px solid #ddd",
              padding: "15px",
              borderRadius: "8px",
              background: "#f9f9f9",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <div>
                <span
                  style={{
                    display: "inline-block",
                    padding: "4px 12px",
                    background: getStatusColor(c.status),
                    color: "white",
                    borderRadius: "12px",
                    fontSize: "12px",
                    marginRight: "8px",
                  }}
                >
                  {c.status}
                </span>
                <span
                  style={{
                    display: "inline-block",
                    padding: "4px 12px",
                    background: getPriorityColor(c.priority),
                    color: "white",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                >
                  {c.priority}
                </span>
              </div>
              <div style={{ fontSize: "11px", color: "#666", textAlign: "right" }}>
                <div>ID: {c._id.slice(-6)}</div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(c._id);
                    alert("Full ID copied!");
                  }}
                  style={{
                    marginTop: "3px",
                    padding: "2px 6px",
                    background: "#4caf50",
                    color: "white",
                    border: "none",
                    borderRadius: "3px",
                    cursor: "pointer",
                    fontSize: "9px",
                  }}
                >
                  Copy ID
                </button>
              </div>
            </div>

            <div style={{ marginBottom: "10px" }}>
              <p style={{ margin: "5px 0" }}>
                <strong>PNR:</strong> {c.pnr} | <strong>Train:</strong> {c.trainNo}
              </p>
              <p style={{ margin: "5px 0" }}>
                <strong>Coach/Seat:</strong> {c.coach} - {c.seat}
              </p>
              <p style={{ margin: "5px 0" }}>
                <strong>Category:</strong> {c.category}
              </p>
            </div>

            <div style={{ background: "white", padding: "10px", borderRadius: "4px", marginBottom: "10px" }}>
              <strong>Issue:</strong>
              <p style={{ margin: "5px 0 0 0" }}>{c.description}</p>
            </div>

            <div style={{ fontSize: "12px", color: "#666" }}>
              <p style={{ margin: "5px 0" }}>
                <strong>Raised by:</strong> {c.createdBy?.name || "Unknown"} ({c.createdBy?.email})
              </p>
              {c.assignedTo && (
                <p style={{ margin: "5px 0" }}>
                  <strong>Assigned to:</strong> {c.assignedTo.name} (ID: {c.assignedTo.employeeId})
                </p>
              )}
              <p style={{ margin: "5px 0" }}>
                <strong>Created:</strong> {new Date(c.createdAt).toLocaleString()}
              </p>
            </div>

            {/* Update Status Section - Only for TTE/Admin */}
            {canUpdateComplaint(c) && (
              <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #ddd" }}>
                {updatingId === c._id ? (
                  <div style={{ background: "#fff", padding: "10px", borderRadius: "4px" }}>
                    <h4 style={{ margin: "0 0 10px 0" }}>Update Status</h4>
                    
                    <div style={{ marginBottom: "10px" }}>
                      <label style={{ fontSize: "13px" }}>New Status:</label>
                      <select
                        value={updateForm.status}
                        onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                        style={{ width: "100%", padding: "6px", marginTop: "3px" }}
                      >
                        <option value="">Select Status</option>
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>

                    <div style={{ marginBottom: "10px" }}>
                      <label style={{ fontSize: "13px" }}>Comment:</label>
                      <textarea
                        value={updateForm.comment}
                        onChange={(e) => setUpdateForm({ ...updateForm, comment: e.target.value })}
                        placeholder="Add a comment..."
                        rows="2"
                        style={{ width: "100%", padding: "6px", marginTop: "3px" }}
                      />
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => handleUpdateStatus(c._id)}
                        disabled={!updateForm.status}
                        style={{
                          padding: "6px 12px",
                          background: updateForm.status ? "#4caf50" : "#ccc",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: updateForm.status ? "pointer" : "not-allowed",
                          fontSize: "13px",
                        }}
                      >
                        Update
                      </button>
                      <button
                        onClick={() => {
                          setUpdatingId(null);
                          setUpdateForm({ status: "", comment: "" });
                        }}
                        style={{
                          padding: "6px 12px",
                          background: "#f44336",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "13px",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setUpdatingId(c._id);
                      setUpdateForm({ status: c.status, comment: "" });
                    }}
                    style={{
                      padding: "6px 12px",
                      background: "#2196f3",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "13px",
                    }}
                  >
                    📝 Update Status
                  </button>
                )}
              </div>
            )}

            {/* Status History */}
            {c.statusHistory && c.statusHistory.length > 1 && (
              <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid #ddd" }}>
                <strong style={{ fontSize: "13px" }}>Status History:</strong>
                <div style={{ maxHeight: "150px", overflowY: "auto", marginTop: "5px" }}>
                  {c.statusHistory.slice().reverse().map((history, idx) => (
                    <div key={idx} style={{ background: "white", padding: "6px", marginTop: "4px", borderRadius: "4px", fontSize: "11px" }}>
                      <span style={{ fontWeight: "bold", color: getStatusColor(history.status) }}>
                        {history.status}
                      </span>
                      {history.comment && <span> - {history.comment}</span>}
                      <div style={{ color: "#999", marginTop: "2px" }}>
                        by {history.updatedBy?.name} at {new Date(history.updatedAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            {c.comments && c.comments.length > 0 && (
              <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid #ddd" }}>
                <strong style={{ fontSize: "13px" }}>Comments ({c.comments.length}):</strong>
                {c.comments.map((comment, idx) => (
                  <div key={idx} style={{ background: "white", padding: "8px", marginTop: "5px", borderRadius: "4px", fontSize: "12px" }}>
                    <p style={{ margin: 0 }}>{comment.text}</p>
                    <p style={{ margin: "5px 0 0 0", fontSize: "10px", color: "#666" }}>
                      - {comment.addedBy?.name} at {new Date(comment.addedAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
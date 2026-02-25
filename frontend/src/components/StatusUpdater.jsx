import { useState } from "react";
import API from "../api";

export default function StatusUpdater({ onStatusUpdated, complaintId: propComplaintId }) {
  const [complaintId, setComplaintId] = useState(propComplaintId || "");
  const [status, setStatus] = useState("Pending");
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  const updateStatus = async (e) => {
    e.preventDefault();
    
    if (!complaintId) {
      setMessage("Enter complaint ID");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await API.put(`/complaints/${complaintId}/status`, { status, comment });
      setMessage("Status updated successfully");
      setMessageType("success");
      setComplaintId("");
      setComment("");
      
      if (onStatusUpdated) {
        onStatusUpdated();
      }
    } catch (err) {
      console.error("Update error:", err);
      console.error("Error response:", err.response?.data);
      setMessage(err.response?.data?.message || "Failed to update status");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ border: "1px solid #ddd", padding: "20px", marginTop: "20px", borderRadius: "8px" }}>
      <h3>Update Complaint Status</h3>

      {message && (
        <div
          style={{
            padding: "10px",
            background: messageType === "success" ? "#e8f5e9" : "#ffebee",
            color: messageType === "success" ? "#2e7d32" : "#c62828",
            marginBottom: "15px",
            borderRadius: "4px",
          }}
        >
          {message}
        </div>
      )}

      <form onSubmit={updateStatus}>
        <div style={{ marginBottom: "15px" }}>
          <label>Complaint ID:</label>
          <input
            type="text"
            placeholder="Paste the FULL complaint ID here"
            value={complaintId}
            onChange={(e) => setComplaintId(e.target.value)}
            style={{ width: "100%", padding: "8px", marginTop: "5px", fontFamily: "monospace" }}
          />
          <small style={{ color: "#666" }}>
            💡 Tip: Copy the ID shown next to "ID:" in the complaint card (should be 24 characters long)
          </small>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>New Status:</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          >
            <option value="Raised">Raised</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Comment (optional):</label>
          <textarea
            placeholder="Add a comment about this status change"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows="3"
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ padding: "10px 20px", background: "#1976d2", color: "white", border: "none", cursor: "pointer", borderRadius: "4px" }}
        >
          {loading ? "Updating..." : "Update Status"}
        </button>
      </form>
    </div>
  );
}
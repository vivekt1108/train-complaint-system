import { useState } from "react";
import API from "../api";

export default function RaiseComplaint({ onComplaintRaised }) {
  const [form, setForm] = useState({
    pnr: "",
    trainNo: "",
    coach: "",
    seat: "",
    category: "Cleanliness",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submitComplaint = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await API.post("/complaints", form);
      setSuccess("Complaint submitted successfully!");
      setForm({
        pnr: "",
        trainNo: "",
        coach: "",
        seat: "",
        category: "Cleanliness",
        description: "",
      });
      
      // Notify parent to refresh complaint list
      if (onComplaintRaised) {
        onComplaintRaised();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit complaint");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ border: "1px solid #ddd", padding: "20px", marginBottom: "20px", borderRadius: "8px" }}>
      <h3>Raise a Complaint</h3>

      {error && (
        <div style={{ padding: "10px", background: "#ffebee", color: "#c62828", marginBottom: "15px", borderRadius: "4px" }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ padding: "10px", background: "#e8f5e9", color: "#2e7d32", marginBottom: "15px", borderRadius: "4px" }}>
          {success}
        </div>
      )}

      <form onSubmit={submitComplaint}>
        <div style={{ marginBottom: "15px" }}>
          <label>PNR Number:</label>
          <input
            type="text"
            name="pnr"
            placeholder="Enter PNR"
            value={form.pnr}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Train Number:</label>
          <input
            type="text"
            name="trainNo"
            placeholder="Enter Train No"
            value={form.trainNo}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </div>

        <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
          <div style={{ flex: 1 }}>
            <label>Coach:</label>
            <input
              type="text"
              name="coach"
              placeholder="e.g., S4"
              value={form.coach}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: "8px", marginTop: "5px" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>Seat:</label>
            <input
              type="text"
              name="seat"
              placeholder="e.g., 42"
              value={form.seat}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: "8px", marginTop: "5px" }}
            />
          </div>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Category:</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          >
            <option value="Cleanliness">Cleanliness</option>
            <option value="Electrical">Electrical</option>
            <option value="Mechanical">Mechanical</option>
            <option value="Safety">Safety</option>
            <option value="Food">Food</option>
            <option value="Staff Behavior">Staff Behavior</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Description:</label>
          <textarea
            name="description"
            placeholder="Describe your issue in detail"
            value={form.description}
            onChange={handleChange}
            required
            rows="4"
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ padding: "10px 20px", background: "#1976d2", color: "white", border: "none", cursor: "pointer", borderRadius: "4px" }}
        >
          {loading ? "Submitting..." : "Submit Complaint"}
        </button>
      </form>
    </div>
  );
}
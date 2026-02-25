import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ComplaintList from "../components/ComplaintList";
import StatusUpdater from "../components/StatusUpdater";
import API from "../api";

export default function Admin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [refreshKey]);

  const fetchStats = async () => {
    try {
      const res = await API.get("/complaints/stats/dashboard");
      setStats(res.data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleStatusUpdated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", padding: "15px", background: "#f5f5f5", borderRadius: "8px" }}>
        <div>
          <h2 style={{ margin: 0 }}>Admin Dashboard</h2>
          <p style={{ margin: "5px 0 0 0", color: "#666" }}>
            Welcome, {user?.name}! | Role: {user?.role}
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{ padding: "8px 20px", background: "#f44336", color: "white", border: "none", cursor: "pointer", borderRadius: "4px" }}
        >
          Logout
        </button>
      </div>

      {/* Statistics Dashboard */}
      {!loadingStats && stats && (
        <div style={{ marginBottom: "30px" }}>
          <h3>Overview Statistics</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginBottom: "20px" }}>
            <div style={{ background: "#e3f2fd", padding: "20px", borderRadius: "8px", textAlign: "center" }}>
              <h4 style={{ margin: "0 0 10px 0", color: "#1976d2" }}>Total Complaints</h4>
              <p style={{ fontSize: "32px", fontWeight: "bold", margin: 0 }}>{stats.totalComplaints}</p>
            </div>
            <div style={{ background: "#fff3e0", padding: "20px", borderRadius: "8px", textAlign: "center" }}>
              <h4 style={{ margin: "0 0 10px 0", color: "#f57c00" }}>Raised</h4>
              <p style={{ fontSize: "32px", fontWeight: "bold", margin: 0 }}>{stats.raisedComplaints}</p>
            </div>
            <div style={{ background: "#e1f5fe", padding: "20px", borderRadius: "8px", textAlign: "center" }}>
              <h4 style={{ margin: "0 0 10px 0", color: "#0277bd" }}>Pending</h4>
              <p style={{ fontSize: "32px", fontWeight: "bold", margin: 0 }}>{stats.pendingComplaints}</p>
            </div>
            <div style={{ background: "#f3e5f5", padding: "20px", borderRadius: "8px", textAlign: "center" }}>
              <h4 style={{ margin: "0 0 10px 0", color: "#7b1fa2" }}>In Progress</h4>
              <p style={{ fontSize: "32px", fontWeight: "bold", margin: 0 }}>{stats.inProgressComplaints}</p>
            </div>
            <div style={{ background: "#e8f5e9", padding: "20px", borderRadius: "8px", textAlign: "center" }}>
              <h4 style={{ margin: "0 0 10px 0", color: "#388e3c" }}>Resolved</h4>
              <p style={{ fontSize: "32px", fontWeight: "bold", margin: 0 }}>{stats.resolvedComplaints}</p>
            </div>
            <div style={{ background: "#ffebee", padding: "20px", borderRadius: "8px", textAlign: "center" }}>
              <h4 style={{ margin: "0 0 10px 0", color: "#d32f2f" }}>Critical</h4>
              <p style={{ fontSize: "32px", fontWeight: "bold", margin: 0 }}>{stats.criticalComplaints}</p>
            </div>
          </div>

          {/* Category and Priority Breakdown */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div style={{ background: "#f9f9f9", padding: "15px", borderRadius: "8px" }}>
              <h4>Category Breakdown</h4>
              {stats.categoryStats.map((cat) => (
                <div key={cat._id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #ddd" }}>
                  <span>{cat._id}</span>
                  <strong>{cat.count}</strong>
                </div>
              ))}
            </div>
            <div style={{ background: "#f9f9f9", padding: "15px", borderRadius: "8px" }}>
              <h4>Priority Breakdown</h4>
              {stats.priorityStats.map((pri) => (
                <div key={pri._id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #ddd" }}>
                  <span>{pri._id}</span>
                  <strong>{pri.count}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* All Complaints */}
      <div style={{ marginBottom: "30px" }}>
        <h3>All Complaints</h3>
        <ComplaintList refresh={refreshKey} />
      </div>

      {/* Status Updater */}
      <StatusUpdater onStatusUpdated={handleStatusUpdated} />
    </div>
  );
}
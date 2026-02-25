import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ComplaintList from "../components/ComplaintList";
import StatusUpdater from "../components/StatusUpdater";

export default function TTE() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleStatusUpdated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", padding: "15px", background: "#f5f5f5", borderRadius: "8px" }}>
        <div>
          <h2 style={{ margin: 0 }}>TTE Dashboard</h2>
          <p style={{ margin: "5px 0 0 0", color: "#666" }}>
            Welcome, {user?.name}! | Employee ID: {user?.employeeId || "N/A"}
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{ padding: "8px 20px", background: "#f44336", color: "white", border: "none", cursor: "pointer", borderRadius: "4px" }}
        >
          Logout
        </button>
      </div>

      <div style={{ marginBottom: "30px" }}>
        <h3>Assigned & Available Complaints</h3>
        <p style={{ color: "#666" }}>You can see complaints assigned to you or unassigned complaints that need attention.</p>
        <ComplaintList refresh={refreshKey} />
      </div>

      <StatusUpdater onStatusUpdated={handleStatusUpdated} />
    </div>
  );
}
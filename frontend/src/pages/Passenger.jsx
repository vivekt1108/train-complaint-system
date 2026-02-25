import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import RaiseComplaint from "../components/RaiseComplaint";
import ComplaintList from "../components/ComplaintList";

export default function Passenger() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleComplaintRaised = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", padding: "15px", background: "#f5f5f5", borderRadius: "8px" }}>
        <div>
          <h2 style={{ margin: 0 }}>Passenger Portal</h2>
          <p style={{ margin: "5px 0 0 0", color: "#666" }}>
            Welcome, {user?.name}!
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{ padding: "8px 20px", background: "#f44336", color: "white", border: "none", cursor: "pointer", borderRadius: "4px" }}
        >
          Logout
        </button>
      </div>

      <RaiseComplaint onComplaintRaised={handleComplaintRaised} />
      
      <div style={{ marginTop: "30px" }}>
        <h3>My Complaints</h3>
        <ComplaintList refresh={refreshKey} />
      </div>
    </div>
  );
}
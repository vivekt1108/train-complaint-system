import { useNavigate } from "react-router-dom";

function RoleSelect() {
  const navigate = useNavigate();
  
  return (
    <div className="container">
      <h1>Train Complaint System</h1>
      <div className="card-box">
        <button onClick={() => navigate("/passenger")}>Passenger</button>
        <button onClick={() => navigate("/tte")}>TTE</button>
        <button onClick={() => navigate("/admin")}>Admin</button>
      </div>
    </div>
  );
}
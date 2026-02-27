import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Passenger from "./pages/Passenger";
import TTE from "./pages/TTE";
import Admin from "./pages/Admin";
import ComplaintReceiver from "./pages/ComplaintReceiver";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route
            path="/passenger"
            element={
              <ProtectedRoute allowedRoles={["passenger"]}>
                <Passenger />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/tte"
            element={
              <ProtectedRoute allowedRoles={["tte"]}>
                <TTE />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Admin />
              </ProtectedRoute>
            }
          />

          <Route
            path="/complaint-receiver"
            element={
              <ProtectedRoute allowedRoles={["complaint-receiver"]}>
                <ComplaintReceiver />
              </ProtectedRoute>
            }
          />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
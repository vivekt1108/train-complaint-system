import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api";

export default function ComplaintReceiver() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [generatedOTP, setGeneratedOTP] = useState(null);
  const [otpExpiry, setOtpExpiry] = useState(null);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await API.get("/complaints");
      setComplaints(res.data.complaints);
    } catch (err) {
      console.error("Error fetching complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDone = async (complaintId) => {
    try {
      const res = await API.put(`/complaints/${complaintId}/mark-done`);
      setGeneratedOTP(res.data.otp);
      setOtpExpiry(new Date(res.data.expiresAt));
      setSelectedComplaint(complaintId);
      alert(`Work completed! OTP Generated: ${res.data.otp}\n\nPlease share this OTP with the passenger.`);
      fetchComplaints(); // Refresh list
    } catch (err) {
      alert(err.response?.data?.message || "Failed to generate OTP");
    }
  };

  const handleUpdateStatus = async (complaintId, status) => {
    try {
      await API.put(`/complaints/${complaintId}/status`, { 
        status, 
        comment: `Status updated to ${status}` 
      });
      alert("Status updated successfully!");
      fetchComplaints();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getStatusColor = (status) => {
    const colors = {
      Assigned: "bg-blue-100 text-blue-800",
      "In Progress": "bg-purple-100 text-purple-800",
      "Pending Verification": "bg-yellow-100 text-yellow-800",
      Resolved: "bg-green-100 text-green-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getPriorityColor = (priority) => {
    const colors = {
      Critical: "bg-red-100 text-red-800",
      High: "bg-orange-100 text-orange-800",
      Normal: "bg-blue-100 text-blue-800",
      Low: "bg-green-100 text-green-800",
    };
    return colors[priority] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading complaints...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white text-xl font-bold">📋</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Complaint Receiver Dashboard</h1>
                <p className="text-sm text-gray-500">
                  {user?.name} • {user?.assignedCategory} Specialist
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors duration-200 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-6 rounded-r-lg">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-purple-500 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="font-semibold text-purple-900 mb-1">Your Assigned Category: {user?.assignedCategory}</h3>
              <p className="text-sm text-purple-700">
                You will only see complaints related to {user?.assignedCategory}. When you complete work, generate OTP and share it with the passenger for verification.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Assigned</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{complaints.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">
                  {complaints.filter(c => c.status === "In Progress").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Verification</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">
                  {complaints.filter(c => c.status === "Pending Verification").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Complaints List */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">My Assigned Complaints</h2>
            <button
              onClick={fetchComplaints}
              className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors font-medium"
            >
              Refresh
            </button>
          </div>

          {complaints.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 text-lg">No complaints assigned yet</p>
              <p className="text-gray-400 text-sm mt-1">New complaints will appear here automatically</p>
            </div>
          ) : (
            <div className="space-y-4">
              {complaints.map((complaint) => (
                <div key={complaint._id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(complaint.status)}`}>
                        {complaint.status}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(complaint.priority)}`}>
                        {complaint.priority}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">ID: {complaint._id.slice(-6)}</span>
                  </div>

                  {/* Details */}
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Train & Location</p>
                      <p className="font-semibold">Train {complaint.trainNo} • Coach {complaint.coach} • Seat {complaint.seat}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Passenger</p>
                      <p className="font-semibold">{complaint.createdBy?.name}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-600 mb-1">Issue Description:</p>
                    <p className="text-gray-800">{complaint.description}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    {complaint.status === "Assigned" && (
                      <button
                        onClick={() => handleUpdateStatus(complaint._id, "In Progress")}
                        className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Start Working
                      </button>
                    )}

                    {complaint.status === "In Progress" && (
                      <button
                        onClick={() => handleMarkDone(complaint._id)}
                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Mark as Done & Generate OTP
                      </button>
                    )}

                    {complaint.status === "Pending Verification" && (
                      <div className="flex-1 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-center text-yellow-800">
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          <span className="font-medium">Waiting for passenger OTP verification</span>
                        </div>
                      </div>
                    )}

                    {complaint.status === "Resolved" && (
                      <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                        <span className="text-green-800 font-medium">✅ Verified & Resolved</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
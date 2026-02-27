import { useState, useRef, useEffect } from "react";
import API from "../api";
import { searchTrains, getTrainByNumber, validatePNR, verifyPNR } from "../services/trainService";

export default function RaiseComplaint({ onComplaintRaised }) {
  const [form, setForm] = useState({
    pnr: "",
    trainNo: "",
    trainName: "",
    coach: "",
    seat: "",
    category: "Cleanliness",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Train search states
  const [trainQuery, setTrainQuery] = useState("");
  const [trainSuggestions, setTrainSuggestions] = useState([]);
  const [showTrainDropdown, setShowTrainDropdown] = useState(false);
  const trainInputRef = useRef(null);
  
  // PNR verification states
  const [pnrVerifying, setPnrVerifying] = useState(false);
  const [pnrVerified, setPnrVerified] = useState(false);
  const [pnrError, setPnrError] = useState("");

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (trainInputRef.current && !trainInputRef.current.contains(event.target)) {
        setShowTrainDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle train search
  const handleTrainSearch = (value) => {
    setTrainQuery(value);
    setForm({ ...form, trainNo: value, trainName: "" });
    
    if (value.length >= 2) {
      const results = searchTrains(value);
      setTrainSuggestions(results);
      setShowTrainDropdown(results.length > 0);
    } else {
      setTrainSuggestions([]);
      setShowTrainDropdown(false);
    }
  };

  // Select train from dropdown
  const handleSelectTrain = (train) => {
    setForm({ ...form, trainNo: train.number, trainName: train.name });
    setTrainQuery(`${train.number} - ${train.name}`);
    setShowTrainDropdown(false);
  };

  // Verify PNR
  const handleVerifyPNR = async () => {
    if (!form.pnr) {
      setPnrError("Please enter PNR number");
      return;
    }

    if (!validatePNR(form.pnr)) {
      setPnrError("Invalid PNR format. Must be 10 digits.");
      return;
    }

    setPnrVerifying(true);
    setPnrError("");

    try {
      const result = await verifyPNR(form.pnr);
      
      if (result.valid) {
        setPnrVerified(true);
        setForm({
          ...form,
          trainNo: result.train.number,
          trainName: result.train.name,
          coach: result.passenger.coach,
          seat: result.passenger.seat,
        });
        setTrainQuery(`${result.train.number} - ${result.train.name}`);
        setSuccess("PNR verified successfully! ✅");
      }
    } catch (err) {
      setPnrError(err.message || "Failed to verify PNR");
      setPnrVerified(false);
    } finally {
      setPnrVerifying(false);
    }
  };

  const submitComplaint = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await API.post("/complaints", {
        pnr: form.pnr,
        trainNo: form.trainNo,
        coach: form.coach,
        seat: form.seat,
        category: form.category,
        description: form.description,
      });
      
      setSuccess("Complaint submitted successfully! 🎉");
      setForm({
        pnr: "",
        trainNo: "",
        trainName: "",
        coach: "",
        seat: "",
        category: "Cleanliness",
        description: "",
      });
      setTrainQuery("");
      setPnrVerified(false);
      
      if (onComplaintRaised) {
        onComplaintRaised();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit complaint");
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: "Cleanliness", icon: "🧹" },
    { value: "Electrical", icon: "⚡" },
    { value: "Mechanical", icon: "🔧" },
    { value: "Safety", icon: "🚨" },
    { value: "Food", icon: "🍽️" },
    { value: "Staff Behavior", icon: "👥" },
    { value: "Other", icon: "📋" },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 border border-gray-100">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-800">Raise a Complaint</h3>
          <p className="text-sm text-gray-500">Tell us what happened</p>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg animate-pulse">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-700 font-medium">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-green-700 font-medium">{success}</span>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={submitComplaint} className="space-y-6">
        {/* PNR with Verification */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            PNR Number *
          </label>
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                name="pnr"
                placeholder="Enter 10-digit PNR"
                value={form.pnr}
                onChange={handleChange}
                maxLength="10"
                required
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none ${
                  pnrVerified ? "border-green-500 bg-green-50" : "border-gray-300"
                }`}
              />
              {pnrError && (
                <p className="text-red-500 text-xs mt-1">{pnrError}</p>
              )}
            </div>
            <button
              type="button"
              onClick={handleVerifyPNR}
              disabled={pnrVerifying || !form.pnr}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                pnrVerified
                  ? "bg-green-500 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
              }`}
            >
              {pnrVerifying ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : pnrVerified ? (
                "✓ Verified"
              ) : (
                "Verify PNR"
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            💡 Verify your PNR to auto-fill train and seat details
          </p>
        </div>

        {/* Train Search with Autocomplete */}
        <div ref={trainInputRef} className="relative">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Train Number / Name *
          </label>
          <input
            type="text"
            placeholder="Search by train number or name"
            value={trainQuery}
            onChange={(e) => handleTrainSearch(e.target.value)}
            onFocus={() => trainSuggestions.length > 0 && setShowTrainDropdown(true)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
          />
          
          {/* Autocomplete Dropdown */}
          {showTrainDropdown && trainSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
              {trainSuggestions.map((train) => (
                <button
                  key={train.number}
                  type="button"
                  onClick={() => handleSelectTrain(train)}
                  className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-semibold text-gray-800">{train.number}</div>
                  <div className="text-sm text-gray-600">{train.name}</div>
                </button>
              ))}
            </div>
          )}
          
          {form.trainName && (
            <p className="text-sm text-green-600 mt-1 font-medium">
              ✓ {form.trainName}
            </p>
          )}
        </div>

        {/* Coach and Seat Row */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Coach *
            </label>
            <input
              type="text"
              name="coach"
              placeholder="e.g., S4"
              value={form.coach}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Seat Number *
            </label>
            <input
              type="text"
              name="seat"
              placeholder="e.g., 42"
              value={form.seat}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Category *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categories.map((cat) => (
              <label
                key={cat.value}
                className={`relative flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  form.category === cat.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="category"
                  value={cat.value}
                  checked={form.category === cat.value}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className="text-3xl mb-2">{cat.icon}</div>
                <div className="text-xs font-medium text-gray-700 text-center">
                  {cat.value}
                </div>
                {form.category === cat.value && (
                  <div className="absolute top-2 right-2">
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            name="description"
            placeholder="Please describe your issue in detail..."
            value={form.description}
            onChange={handleChange}
            required
            rows="5"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none"
          />
          <p className="mt-2 text-sm text-gray-500">
            Be as specific as possible to help us resolve your issue faster
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg flex items-center justify-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Submitting...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Submit Complaint
            </>
          )}
        </button>
      </form>
    </div>
  );
}
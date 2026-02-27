const mongoose = require("mongoose");

const ComplaintSchema = new mongoose.Schema({
  pnr: {
    type: String,
    required: true,
  },
  trainNo: {
    type: String,
    required: true,
  },
  coach: {
    type: String,
    required: true,
  },
  seat: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ["Cleanliness", "Electrical", "Mechanical", "Safety", "Food", "Staff Behavior", "Other"],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    enum: ["Low", "Normal", "High", "Critical"],
    default: "Normal",
  },
  status: {
    type: String,
    enum: ["Raised", "Assigned", "In Progress", "Pending Verification", "Resolved", "Closed", "Rejected"],
    default: "Raised",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  // OTP System for verification
  otp: {
    type: String,
  },
  otpVerified: {
    type: Boolean,
    default: false,
  },
  otpGeneratedAt: {
    type: Date,
  },
  otpExpiresAt: {
    type: Date,
  },
  resolvedAt: {
    type: Date,
  },
  comments: [
    {
      text: String,
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      addedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  statusHistory: [
    {
      status: String,
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
      comment: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Complaint", ComplaintSchema);
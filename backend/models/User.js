const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["passenger", "tte", "admin", "complaint-receiver"],
    default: "passenger",
  },
  employeeId: {
    type: String,
    sparse: true,
  },
  // For Complaint Receivers - their specialized category
  assignedCategory: {
    type: String,
    enum: ["Cleanliness", "Electrical", "Mechanical", "Safety", "Food", "Staff Behavior", "Other"],
  },
  // For location-based assignment (future feature)
  currentLocation: {
    train: String,
    coach: String,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", UserSchema);
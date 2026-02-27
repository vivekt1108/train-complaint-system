const router = require("express").Router();
const Complaint = require("../models/complaints");
const User = require("../models/User");
const { verifyToken, checkRole } = require("../middleware/auth");

// All routes require authentication
router.use(verifyToken);


// DEBUG: Check available receivers
router.get("/debug/receivers/:category", async (req, res) => {
  try {
    const receivers = await User.find({
      role: "complaint-receiver",
      assignedCategory: req.params.category,
      isAvailable: true,
    });
    
    res.json({
      category: req.params.category,
      count: receivers.length,
      receivers: receivers.map(r => ({
        name: r.name,
        email: r.email,
        category: r.assignedCategory
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper function to generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper function to find nearest available receiver
const findNearestReceiver = async (category, trainNo, coach) => {
  // Find all complaint receivers for this category who are available
  const receivers = await User.find({
    role: "complaint-receiver",
    assignedCategory: category,
    isAvailable: true,
  });

  if (receivers.length === 0) return null;

  // TODO: In future, implement actual location-based matching
  // For now, return first available receiver
  // You can enhance this with location matching logic
  return receivers[0];
};

// Raise complaint (Passengers only) - WITH AUTO-ASSIGNMENT
router.post("/", checkRole("passenger"), async (req, res) => {
  try {
    const { pnr, trainNo, coach, seat, category, description } = req.body;

    if (!pnr || !trainNo || !coach || !seat || !category || !description) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Auto-set priority based on category
    let priority = "Normal";
    if (category === "Safety") priority = "Critical";
    else if (category === "Electrical" || category === "Mechanical") priority = "High";

    // Find nearest available receiver for this category
    const receiver = await findNearestReceiver(category, trainNo, coach);

    const complaint = new Complaint({
      pnr,
      trainNo,
      coach,
      seat,
      category,
      description,
      priority,
      createdBy: req.user.id,
      assignedTo: receiver?._id || null,
      status: receiver ? "Assigned" : "Raised",
      statusHistory: [{
        status: receiver ? "Assigned" : "Raised",
        updatedBy: req.user.id,
        comment: receiver 
          ? `Auto-assigned to ${receiver.name} (${category} specialist)`
          : "Complaint raised by passenger"
      }]
    });

    await complaint.save();
    await complaint.populate("createdBy", "name email");
    await complaint.populate("assignedTo", "name email assignedCategory");

    res.status(201).json({
      message: receiver 
        ? `Complaint assigned to ${receiver.name}` 
        : "Complaint submitted successfully",
      complaint,
    });
  } catch (err) {
    console.error("Error creating complaint:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get complaints based on role
router.get("/", async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === "passenger") {
      filter.createdBy = req.user.id;
    } else if (req.user.role === "complaint-receiver") {
      // Complaint receivers see only their assigned complaints
      filter.assignedTo = req.user.id;
    } else if (req.user.role === "tte") {
      filter.$or = [
        { assignedTo: req.user.id },
        { assignedTo: null, status: { $in: ["Raised", "Assigned"] } }
      ];
    }
    // Admin sees all

    const complaints = await Complaint.find(filter)
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email employeeId assignedCategory")
      .sort({ createdAt: -1 });

    res.json({ complaints, count: complaints.length });
  } catch (err) {
    console.error("Error fetching complaints:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get single complaint
router.get("/:id", async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email employeeId assignedCategory")
      .populate("comments.addedBy", "name email")
      .populate("statusHistory.updatedBy", "name email");

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Check permission
    if (req.user.role === "passenger" && complaint.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({ complaint });
  } catch (err) {
    console.error("Error fetching complaint:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Update complaint status (for TTE and Admin only - NOT complaint receiver)
// Update complaint status (TTE, Admin, AND Complaint Receiver)
router.put("/:id/status", checkRole("tte", "admin", "complaint-receiver"), async (req, res) => {
  try {
    const { status, comment } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Complaint receivers can only update their assigned complaints
    if (req.user.role === "complaint-receiver") {
      if (!complaint.assignedTo || complaint.assignedTo.toString() !== req.user.id) {
        return res.status(403).json({ message: "This complaint is not assigned to you" });
      }
    }

    // TTE can only update assigned complaints
    if (req.user.role === "tte") {
      if (complaint.assignedTo && complaint.assignedTo.toString() !== req.user.id) {
        return res.status(403).json({ message: "You can only update complaints assigned to you" });
      }
      // Auto-assign to this TTE if unassigned
      if (!complaint.assignedTo && complaint.status === "Raised") {
        complaint.assignedTo = req.user.id;
      }
    }

    // Update status
    complaint.status = status;
    
    // Add to status history
    complaint.statusHistory.push({
      status,
      updatedBy: req.user.id,
      comment: comment || `Status updated to ${status}`,
    });

    // Update updatedAt
    complaint.updatedAt = Date.now();

    await complaint.save();
    
    // Populate fields before sending response
    await complaint.populate("createdBy", "name email");
    await complaint.populate("assignedTo", "name email employeeId assignedCategory");
    await complaint.populate("statusHistory.updatedBy", "name email");

    res.json({
      message: "Status updated successfully",
      complaint,
    });
  } catch (err) {
    console.error("Error updating status:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
// Mark as Done and Generate OTP (Complaint Receiver only)
router.put("/:id/mark-done", checkRole("complaint-receiver"), async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Check if complaint is assigned to this receiver
    if (complaint.assignedTo?.toString() !== req.user.id) {
      return res.status(403).json({ message: "This complaint is not assigned to you" });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    complaint.otp = otp;
    complaint.otpGeneratedAt = Date.now();
    complaint.otpExpiresAt = expiresAt;
    complaint.status = "Pending Verification";
    complaint.otpVerified = false;

    complaint.statusHistory.push({
      status: "Pending Verification",
      updatedBy: req.user.id,
      comment: "Work completed. Waiting for passenger verification.",
    });

    await complaint.save();
    await complaint.populate("createdBy assignedTo", "name email");

    res.json({
      message: "OTP generated successfully. Please share with passenger.",
      complaint,
      otp, // Send OTP to receiver so they can share with passenger
      expiresAt,
    });
  } catch (err) {
    console.error("Error generating OTP:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Verify OTP (Passenger only)
router.post("/:id/verify-otp", checkRole("passenger"), async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ message: "OTP is required" });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Check if complaint belongs to this passenger
    if (complaint.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "This is not your complaint" });
    }

    // Check if OTP exists
    if (!complaint.otp) {
      return res.status(400).json({ message: "No OTP generated for this complaint" });
    }

    // Check if OTP expired
    if (new Date() > complaint.otpExpiresAt) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    // Verify OTP
    if (complaint.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP. Please try again." });
    }

    // OTP is correct - mark as resolved
    complaint.status = "Resolved";
    complaint.otpVerified = true;
    complaint.resolvedAt = Date.now();

    complaint.statusHistory.push({
      status: "Resolved",
      updatedBy: req.user.id,
      comment: "Verified by passenger. Complaint resolved successfully.",
    });

    // Clear OTP data
    complaint.otp = undefined;
    complaint.otpGeneratedAt = undefined;
    complaint.otpExpiresAt = undefined;

    await complaint.save();
    await complaint.populate("createdBy assignedTo", "name email");

    res.json({
      message: "Complaint verified and resolved successfully! ✅",
      complaint,
    });
  } catch (err) {
    console.error("Error verifying OTP:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Add comment
router.post("/:id/comment", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    if (req.user.role === "passenger" && complaint.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    complaint.comments.push({
      text,
      addedBy: req.user.id,
    });

    await complaint.save();
    await complaint.populate("comments.addedBy", "name email role");

    res.json({
      message: "Comment added successfully",
      complaint,
    });
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Dashboard statistics
router.get("/stats/dashboard", checkRole("admin"), async (req, res) => {
  try {
    const totalComplaints = await Complaint.countDocuments();
    const raisedComplaints = await Complaint.countDocuments({ status: "Raised" });
    const assignedComplaints = await Complaint.countDocuments({ status: "Assigned" });
    const inProgressComplaints = await Complaint.countDocuments({ status: "In Progress" });
    const pendingVerification = await Complaint.countDocuments({ status: "Pending Verification" });
    const resolvedComplaints = await Complaint.countDocuments({ status: "Resolved" });
    const criticalComplaints = await Complaint.countDocuments({ priority: "Critical" });

    const categoryStats = await Complaint.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const priorityStats = await Complaint.aggregate([
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]);

    res.json({
      totalComplaints,
      raisedComplaints,
      assignedComplaints,
      inProgressComplaints,
      pendingVerification,
      resolvedComplaints,
      criticalComplaints,
      categoryStats,
      priorityStats,
    });
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
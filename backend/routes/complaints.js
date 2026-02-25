const router = require("express").Router();
const Complaint = require("../models/complaints");
const { verifyToken, checkRole } = require("../middleware/auth");

// All routes require authentication
router.use(verifyToken);

// Raise complaint (Passengers only)
router.post("/", checkRole("passenger"), async (req, res) => {
  try {
    const { pnr, trainNo, coach, seat, category, description } = req.body;

    // Validation
    if (!pnr || !trainNo || !coach || !seat || !category || !description) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Auto-set priority based on category
    let priority = "Normal";
    if (category === "Safety") priority = "Critical";
    else if (category === "Electrical" || category === "Mechanical") priority = "High";

    const complaint = new Complaint({
      pnr,
      trainNo,
      coach,
      seat,
      category,
      description,
      priority,
      createdBy: req.user.id,
      statusHistory: [{
        status: "Raised",
        updatedBy: req.user.id,
        comment: "Complaint raised by passenger"
      }]
    });

    await complaint.save();
    await complaint.populate("createdBy", "name email");

    res.status(201).json({
      message: "Complaint submitted successfully",
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

    // Passengers can only see their own complaints
    if (req.user.role === "passenger") {
      filter.createdBy = req.user.id;
    }
    // TTE sees assigned complaints or unassigned
    else if (req.user.role === "tte") {
      filter.$or = [
        { assignedTo: req.user.id },
        { assignedTo: null, status: { $in: ["Raised", "Pending"] } }
      ];
    }
    // Admin and complaint-receiver see all complaints

    const complaints = await Complaint.find(filter)
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email employeeId")
      .sort({ createdAt: -1 });

    res.json({ complaints, count: complaints.length });
  } catch (err) {
    console.error("Error fetching complaints:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get single complaint by ID
router.get("/:id", async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email employeeId")
      .populate("comments.addedBy", "name email")
      .populate("statusHistory.updatedBy", "name email");

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Check permission - passengers can only see their own
    if (req.user.role === "passenger" && complaint.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({ complaint });
  } catch (err) {
    console.error("Error fetching complaint:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Update complaint status (TTE, Admin, Complaint Receiver)
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

    // TTE can only update assigned complaints
     if (req.user.role === "tte") {
      // Check if complaint is assigned to this TTE
      if (complaint.assignedTo && complaint.assignedTo.toString() !== req.user.id) {
        return res.status(403).json({ message: "You can only update complaints assigned to you" });
      }
      // Also allow TTE to update unassigned complaints
      if (!complaint.assignedTo && complaint.status === "Raised") {
        // Auto-assign to this TTE
        complaint.assignedTo = req.user.id;
      }
    }

    complaint.status = status;
    complaint.statusHistory.push({
      status,
      updatedBy: req.user.id,
      comment: comment || `Status updated to ${status}`,
    });
    
    complaint.updatedAt = Date.now();

    await complaint.save();
    await complaint.populate("createdBy", "name email");
    await complaint.populate("assignedTo", "name email employeeId");
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

// Assign complaint to TTE (Admin and Complaint Receiver only)
router.put("/:id/assign", checkRole("admin", "complaint-receiver"), async (req, res) => {
  try {
    const { tteId } = req.body;

    if (!tteId) {
      return res.status(400).json({ message: "TTE ID is required" });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    complaint.assignedTo = tteId;
    complaint.status = "Pending";
    complaint.statusHistory.push({
      status: "Pending",
      updatedBy: req.user.id,
      comment: "Complaint assigned to TTE",
    });

    await complaint.save();
    await complaint.populate("createdBy assignedTo", "name email employeeId");

    res.json({
      message: "Complaint assigned successfully",
      complaint,
    });
  } catch (err) {
    console.error("Error assigning complaint:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Add comment to complaint
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

    // Check permission
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

// Get dashboard statistics (Admin only)
router.get("/stats/dashboard", checkRole("admin", "complaint-receiver"), async (req, res) => {
  try {
    const totalComplaints = await Complaint.countDocuments();
    const raisedComplaints = await Complaint.countDocuments({ status: "Raised" });
    const pendingComplaints = await Complaint.countDocuments({ status: "Pending" });
    const inProgressComplaints = await Complaint.countDocuments({ status: "In Progress" });
    const resolvedComplaints = await Complaint.countDocuments({ status: "Resolved" });
    const criticalComplaints = await Complaint.countDocuments({ priority: "Critical" });

    // Category-wise breakdown
    const categoryStats = await Complaint.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    // Priority-wise breakdown
    const priorityStats = await Complaint.aggregate([
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]);

    res.json({
      totalComplaints,
      raisedComplaints,
      pendingComplaints,
      inProgressComplaints,
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
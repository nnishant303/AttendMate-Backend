import Leave from "../models/Leave.js";

// POST /api/leaves/request
export const requestLeave = async (req, res) => {
  try {
    const { employeeId, leaveType, fromDate, toDate, reason } = req.body;
    if (!employeeId || !fromDate || !toDate) return res.status(400).json({ message: "Required fields missing" });

    if (new Date(fromDate) > new Date(toDate)) return res.status(400).json({ message: "Invalid date range" });

    // Overlap check (any existing non-rejected leave that intersects requested range)
    const overlapping = await Leave.findOne({
      employeeId,
      status: { $ne: "Rejected" },
      $or: [
        { fromDate: { $lte: toDate }, toDate: { $gte: fromDate } },
      ],
    });

    if (overlapping) return res.status(400).json({ message: "Leave overlaps with existing request" });

    const leave = await Leave.create({ employeeId, leaveType, fromDate, toDate, reason });
    try { req.io?.emit("leaveUpdated", leave); } catch (e) { /* ignore */ }
    res.status(201).json({ message: "Leave requested", leave });
  } catch (err) {
    console.error("requestLeave error:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/leaves  (HR)
export const getLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find().sort({ appliedOn: -1 });
    res.json(leaves);
  } catch (err) {
    console.error("getLeaves error:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/leaves/employee/:employeeId
export const getLeavesByEmployee = async (req, res) => {
  try {
    const leaves = await Leave.find({ employeeId: req.params.employeeId }).sort({ fromDate: -1 });
    res.json(leaves);
  } catch (err) {
    console.error("getLeavesByEmployee error:", err);
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/leaves/:id  (HR) - change status
export const actionLeave = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["Pending", "Approved", "Rejected"];
    if (!allowed.includes(status)) return res.status(400).json({ message: "Invalid status" });

    const leave = await Leave.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!leave) return res.status(404).json({ message: "Leave not found" });

    try { req.io?.emit("leaveUpdated", leave); } catch (e) { /* ignore */ }
    res.json({ message: `Leave ${status}`, leave });
  } catch (err) {
    console.error("actionLeave error:", err);
    res.status(500).json({ message: err.message });
  }
};

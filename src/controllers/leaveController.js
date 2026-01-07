import Leave from "../models/Leave.js";

const formatDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const requestLeave = async (req, res) => {
  try {
    const { employeeId, leaveType, fromDate, toDate, reason } = req.body;

    if (!employeeId || !fromDate || !toDate)
      return res.status(400).json({ message: "Required fields missing" });

    if (new Date(fromDate) > new Date(toDate))
      return res.status(400).json({ message: "Invalid date range" });

    const date = fromDate; 

    await Leave.findOneAndUpdate(
      { date },
      { $setOnInsert: { date, leave_request: [] } },
      { upsert: true }
    );

    const exists = await Leave.findOne({
      date,
      "leave_request.employeeId": employeeId,
      "leave_request.status": { $ne: "Rejected" }
    });

    if (exists)
      return res.status(400).json({ message: "Leave already applied" });

    const leave = await Leave.findOneAndUpdate(
      { date },
      {
        $push: {
          leave_request: {
            employeeId,
            leaveType,
            fromDate,
            toDate,
            reason,
            status: "Pending",
            appliedOn: new Date()
          }
        }
      },
      { new: true }
    );

    res.status(201).json({ message: "Leave requested successfully", leave });
  } catch (err) {
    console.log("requestLeave error:", err);
    res.status(500).json({ message: err.message });
  }
};



export const getLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find().sort({ date: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const getLeavesByEmployee = async (req, res) => {
  try {
    const leaves = await Leave.find({ "leave_request.employeeId": req.params.employeeId });

    const result = leaves.map(doc => ({
      date: doc.date,
      leave_request: doc.leave_request.filter(e => e.employeeId === req.params.employeeId)
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const actionLeave = async (req, res) => {
  try {
    const { status } = req.body;
    const { date, employeeId } = req.params;

    const allowed = ["Pending", "Approved", "Rejected"];
    if (!allowed.includes(status))
      return res.status(400).json({ message: "Invalid status" });

    const leave = await Leave.findOneAndUpdate(
      { date, "leave_request.employeeId": employeeId },
      { $set: { "leave_request.$.status": status } },
      { new: true }
    );

    if (!leave) return res.status(404).json({ message: "Leave not found" });

    res.json({ message: `Leave ${status}`, leave });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

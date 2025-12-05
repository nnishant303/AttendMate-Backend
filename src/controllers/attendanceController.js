import Attendance from "../models/Attendance.js";

// Helper: minutes between two Date objects
const calculateDurationMinutes = (start, end) => {
  if (!start || !end) return 0;
  const diff = new Date(end) - new Date(start);
  return Math.max(0, Math.round(diff / 60000));
};

// POST /api/attendance/check-in
export const checkIn = async (req, res) => {
  try {
    const { employeeId, time, date } = req.body;
    if (!employeeId || !date) return res.status(400).json({ message: "employeeId and date required" });

    // Prevent multiple check-ins for same day
    const existing = await Attendance.findOne({ employeeId, date });
    if (existing) return res.status(400).json({ message: "Already checked in for today" });

    // Build ISO timestamp
    const checkInISO = time && time.includes("T") ? new Date(time) : new Date(`${date}T${time || "00:00:00"}`);

    // Late detection (10:00)
    const lateThreshold = new Date(`${date}T10:00:00`);
    let status = "Present";
    let lateBy = 0;
    if (checkInISO > lateThreshold) {
      status = "Late";
      lateBy = Math.round((checkInISO - lateThreshold) / 60000);
    }

    const attendance = await Attendance.create({
      employeeId,
      date,
      status,
      checkInTime: checkInISO,
      lateBy,
    });

    // Emit to date room and global
    try { req.io?.to(`attendance_${date}`).emit("attendanceUpdated", attendance); } catch(e){/*ignore*/}

    res.status(201).json({ message: "Checked in successfully", attendance });
  } catch (err) {
    console.error("checkIn error:", err);
    res.status(500).json({ message: err.message });
  }
};

// POST /api/attendance/check-out
export const checkOut = async (req, res) => {
  try {
    const { employeeId, time, date } = req.body;
    if (!employeeId || !date) return res.status(400).json({ message: "employeeId and date required" });

    const attendance = await Attendance.findOne({ employeeId, date });
    if (!attendance) return res.status(404).json({ message: "Attendance record not found" });
    if (attendance.checkOutTime) return res.status(400).json({ message: "Already checked out" });

    const checkOutISO = time && time.includes("T") ? new Date(time) : new Date(`${date}T${time || "00:00:00"}`);

    attendance.checkOutTime = checkOutISO;
    attendance.duration = calculateDurationMinutes(attendance.checkInTime, checkOutISO);

    // If checkInTime missing, keep status logic simple
    await attendance.save();

    try { req.io?.to(`attendance_${date}`).emit("attendanceUpdated", attendance); } catch(e){/*ignore*/}

    res.json({ message: "Checked out successfully", attendance });
  } catch (err) {
    console.error("checkOut error:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/attendance?date=YYYY-MM-DD
export const getAllAttendance = async (req, res) => {
  try {
    const { date, page = 1, limit = 100 } = req.query;
    const query = {};
    if (date) query.date = date;

    const records = await Attendance.find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json(records);
  } catch (err) {
    console.error("getAllAttendance error:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/attendance/:employeeId
export const getAttendanceByEmployee = async (req, res) => {
  try {
    const { from, to, page = 1, limit = 100 } = req.query;
    const employeeId = req.params.employeeId;
    if (!employeeId) return res.status(400).json({ message: "employeeId required" });

    const q = { employeeId };
    if (from || to) {
      q.date = {};
      if (from) q.date.$gte = from;
      if (to) q.date.$lte = to;
    }

    const records = await Attendance.find(q)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json(records);
  } catch (err) {
    console.error("getAttendanceByEmployee error:", err);
    res.status(500).json({ message: err.message });
  }
};

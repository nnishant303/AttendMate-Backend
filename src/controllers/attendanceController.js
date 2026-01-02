import Attendance from "../models/Attendance.js";

const getToday = () => new Date().toISOString().split("T")[0];

// POST /api/attendance/check-in
export const checkIn = async (req, res) => {
  try {
    const { employeeId } = req.body;
    const date = getToday();

    if (!employeeId) return res.status(400).json({ message: "employeeId required" });

    const checkInTime = new Date();
    const lateThreshold = new Date(`${date}T10:00:00`);

    await Attendance.findOneAndUpdate(
      { date },
      { $setOnInsert: { date, employees: [] } },
      { upsert: true }
    );

    const exists = await Attendance.findOne({ date, "employees.employeeId": employeeId });
    if (exists) return res.status(400).json({ message: "Already checked in today" });

    await Attendance.updateOne(
      { date },
      {
        $push: {
          employees: {
            employeeId,
            checkInTime,
            status: checkInTime > lateThreshold ? "Late" : "Present",
            lateBy: checkInTime > lateThreshold
              ? Math.round((checkInTime - lateThreshold) / 60000)
              : 0
          }
        }
      }
    );

    res.json({ message: "Checked in successfully" });
  } catch (err) {
    console.log("checkIn error:", err);
    res.status(500).json({ message: err.message });
  }
};

// POST /api/attendance/check-out
export const checkOut = async (req, res) => {
  try {
    const { employeeId } = req.body;
    const date = getToday();

    const doc = await Attendance.findOne({ date, "employees.employeeId": employeeId });
    if (!doc) return res.status(404).json({ message: "Not checked in" });

    const emp = doc.employees.find(e => e.employeeId === employeeId);
    if (emp.checkOutTime) return res.status(400).json({ message: "Already checked out" });

    emp.checkOutTime = new Date();
    emp.duration = Math.round((emp.checkOutTime - emp.checkInTime) / 60000);

    await doc.save();

    res.json({ message: "Checked out successfully" });
  } catch (err) {
    console.log("checkOut error:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/attendance?date=YYYY-MM-DD
export const getAllAttendance = async (req, res) => {
  try {
    const { date } = req.query;
    const q = date ? { date } : {};
    const records = await Attendance.find(q).sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

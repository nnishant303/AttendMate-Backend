import express from "express";
import {
    checkIn,
    checkOut,
    getAllAttendance,
    getAttendanceByEmployee,
} from "../controllers/attendanceController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/check-in", authMiddleware, checkIn);
router.post("/check-out", authMiddleware, checkOut);
router.get("/", authMiddleware, getAllAttendance);
router.get("/:employeeId", authMiddleware, getAttendanceByEmployee);

export default router;

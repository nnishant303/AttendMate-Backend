import express from "express";
import {
    checkIn,
    checkOut,
    getAllAttendance,
    getAttendanceByEmployee,
} from "../controllers/attendanceController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import employeeAuthMiddleware from "../middleware/employeeAuthMiddleware.js";

const router = express.Router();

router.post("/check-in", employeeAuthMiddleware, checkIn);
router.post("/check-out", employeeAuthMiddleware, checkOut);
router.get("/:employeeId", employeeAuthMiddleware, getAttendanceByEmployee);
router.get("/", authMiddleware, getAllAttendance);

export default router;

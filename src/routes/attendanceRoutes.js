import express from "express";
import { checkIn, checkOut, getAllAttendance } from "../controllers/attendanceController.js";
import employeeAuthMiddleware from "../middleware/employeeAuthMiddleware.js";

const router = express.Router();

router.post("/check-in", employeeAuthMiddleware, checkIn);
router.post("/check-out", employeeAuthMiddleware, checkOut);
router.get("/", getAllAttendance);

export default router;

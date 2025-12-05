import express from "express";
import {
  requestLeave,
  getLeaves,
  getLeavesByEmployee,
  actionLeave,
} from "../controllers/leaveController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post("/request", authMiddleware, requestLeave);
router.get("/", authMiddleware, adminMiddleware, getLeaves);
router.get("/employee/:employeeId", authMiddleware, getLeavesByEmployee);
router.put("/:id", authMiddleware, adminMiddleware, actionLeave);

export default router;

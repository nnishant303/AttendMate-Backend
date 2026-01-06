import express from "express";
import {
  requestLeave,
  getLeaves,
  getLeavesByEmployee,
  actionLeave,
} from "../controllers/leaveController.js";
import combinedAuthMiddleware from "../middleware/combinedAuthMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post("/request", combinedAuthMiddleware, requestLeave);
router.get("/", combinedAuthMiddleware, adminMiddleware, getLeaves);
router.get("/employee/:employeeId", combinedAuthMiddleware, getLeavesByEmployee);
router.put("/:date/:employeeId", combinedAuthMiddleware, adminMiddleware, actionLeave);

export default router;

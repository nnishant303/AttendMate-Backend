import express from "express";
import {
  addEmployee,
  getEmployees,
  getEmployeeById,
  getEmployeeByEmployeeId,
  updateEmployee,
  deleteEmployee,
} from "../controllers/employeeController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post("/add", authMiddleware, adminMiddleware, addEmployee);
router.get("/", authMiddleware, getEmployees);

// New non-conflicting route to get by employeeId (custom id)
router.get("/find/:employeeId", authMiddleware, getEmployeeByEmployeeId);

// Mongo _id route (admin)
router.get("/:id", authMiddleware, getEmployeeById);
router.put("/:id", authMiddleware, adminMiddleware, updateEmployee);
router.delete("/:id", authMiddleware, adminMiddleware, deleteEmployee);

export default router;

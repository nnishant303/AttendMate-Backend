import express from "express";
import {
  addEmployee,
  getEmployees,
  getEmployeeById,
  getEmployeeByEmployeeId,
  updateEmployee,
  deleteEmployee,
} from "../controllers/employeeController.js";

import {
  employeeLogin,
  getEmployeeProfile,
} from "../controllers/employeeAuthController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import employeeAuthMiddleware from "../middleware/employeeAuthMiddleware.js";

const router = express.Router();

// Employee Authentication Routes (Public & Employee-Protected)
router.post("/login", employeeLogin);
router.get("/profile", employeeAuthMiddleware, getEmployeeProfile);

// Employee Management Routes (HR-Protected)
router.post("/add", authMiddleware, adminMiddleware, addEmployee);
router.get("/", getEmployees);

// New non-conflicting route to get by employeeId (custom id)
router.get("/find/:employeeId", authMiddleware, getEmployeeByEmployeeId);

// Mongo _id route (HR)
router.get("/:id", authMiddleware, getEmployeeById);
router.put("/:id", authMiddleware, adminMiddleware, updateEmployee);
router.delete("/:id", authMiddleware, adminMiddleware, deleteEmployee);

export default router;

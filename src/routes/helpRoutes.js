import express from "express";
import {
    createTicket,
    getAllTickets,
    getEmployeeTickets,
    getTicketById,
    addReply,
    updateTicketStatus,
} from "../controllers/helpSupportController.js";
import combinedAuthMiddleware from "../middleware/combinedAuthMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

// Apply auth middleware to all help routes
router.use(combinedAuthMiddleware);

router.post("/tickets", createTicket);
router.get("/tickets", adminMiddleware, getAllTickets);
router.get("/tickets/employee/:employeeId", getEmployeeTickets);
router.get("/tickets/:id", getTicketById);
router.post("/tickets/:id/reply", addReply);
router.put("/tickets/:id/status", adminMiddleware, updateTicketStatus);

export default router;

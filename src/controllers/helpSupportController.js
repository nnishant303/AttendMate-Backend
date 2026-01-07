import SupportTicket from "../models/helpSupport.js";

// @desc Create a new support ticket
// @route POST /api/help/tickets
export const createTicket = async (req, res) => {
    try {
        const { employeeId, employeeName, employeeEmail, issueType, description } = req.body;

        if (!employeeId || !issueType || !description) {
            return res.status(400).json({ message: "Required fields missing" });
        }

        const ticket = await SupportTicket.create({
            employeeId,
            employeeName,
            employeeEmail,
            issueType,
            description,
        });

        res.status(201).json({ message: "Ticket created successfully", ticket });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc Get all support tickets (Admin Only)
// @route GET /api/help/tickets
export const getAllTickets = async (req, res) => {
    try {
        const tickets = await SupportTicket.find().sort({ createdAt: -1 });
        res.json(tickets);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc Get tickets for a specific employee
// @route GET /api/help/tickets/employee/:employeeId
export const getEmployeeTickets = async (req, res) => {
    try {
        const tickets = await SupportTicket.find({ employeeId: req.params.employeeId }).sort({ createdAt: -1 });
        res.json(tickets);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc Get ticket details by ID
// @route GET /api/help/tickets/:id
export const getTicketById = async (req, res) => {
    try {
        const ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: "Ticket not found" });
        res.json(ticket);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc Add a reply to a ticket
// @route POST /api/help/tickets/:id/reply
export const addReply = async (req, res) => {
    try {
        const { message, repliedBy } = req.body;
        const ticket = await SupportTicket.findById(req.params.id);

        if (!ticket) return res.status(404).json({ message: "Ticket not found" });

        ticket.replies.push({ message, repliedBy });
        await ticket.save();

        res.json({ message: "Reply added successfully", ticket });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc Update ticket status (Admin Only)
// @route PUT /api/help/tickets/:id/status
export const updateTicketStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const allowed = ["Open", "In Progress", "Resolved"];

        if (!allowed.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const ticket = await SupportTicket.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!ticket) return res.status(404).json({ message: "Ticket not found" });

        res.json({ message: `Ticket status updated to ${status}`, ticket });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

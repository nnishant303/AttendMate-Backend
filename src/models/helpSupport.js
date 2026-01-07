import mongoose from "mongoose";

const replySchema = new mongoose.Schema({
    message: String,
    repliedBy: String,
    repliedAt: { type: Date, default: Date.now }
});

const supportTicketSchema = new mongoose.Schema(
    {
        employeeId: String,
        employeeName: String,
        employeeEmail: String,
        issueType: String,
        description: String,
        status: {
            type: String,
            enum: ["Open", "In Progress", "Resolved"],
            default: "Open"
        },
        replies: [replySchema]
    },
    { timestamps: true }
);

export default mongoose.model("SupportTicket", supportTicketSchema);

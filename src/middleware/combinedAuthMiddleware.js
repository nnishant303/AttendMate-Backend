import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Employee from "../models/Employee.js";

const combinedAuthMiddleware = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        } else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            // Check session as a fallback (mostly for HR users)
            if (req.session && req.session.userId) {
                req.user = await User.findById(req.session.userId).select("-password");
                if (req.user) return next();
            }
            return res.status(401).json({ message: "Not authorized, no token provided" });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Try finding in HR Users first
            const user = await User.findById(decoded.id).select("-password");
            if (user) {
                req.user = user;
                req.role = "hr";
                return next();
            }

            // Try finding in Employees
            const employee = await Employee.findById(decoded.id).select("-password");
            if (employee) {
                req.employee = employee;
                req.user = employee; // For compatibility if some routes use req.user
                req.role = "employee";
                return next();
            }

            return res.status(401).json({ message: "Not authorized, user not found" });
        } catch (jwtError) {
            // If JWT fails, still check session for HR
            if (req.session && req.session.userId) {
                req.user = await User.findById(req.session.userId).select("-password");
                if (req.user) {
                    req.role = "hr";
                    return next();
                }
            }
            return res.status(401).json({ message: "Not authorized, token invalid" });
        }
    } catch (error) {
        console.error("Combined auth middleware error:", error);
        res.status(500).json({ message: "Internal server error during authentication" });
    }
};

export default combinedAuthMiddleware;

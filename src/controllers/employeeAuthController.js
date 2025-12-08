import Employee from "../models/Employee.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, 
};

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

export const employeeLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }
    
        const employee = await Employee.findOne({ email });
        if (!employee) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const isPasswordValid = await bcrypt.compare(password, employee.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        const token = generateToken(employee._id);

        res.cookie("token", token, cookieOptions);

        res.json({
            message: "Login successful",
            token,
            employee: {
                id: employee._id,
                name: employee.name,
                email: employee.email,
                employeeId: employee.employeeId,
                phone: employee.phone,
                department: employee.department,
                designation: employee.designation,
                joiningDate: employee.joiningDate,
                address: employee.address,
                image: employee.image,
            },
        });
    } catch (err) {
        console.error("employeeLogin error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

export const getEmployeeProfile = async (req, res) => {
    try {
        if (!req.employee) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        res.json({
            employee: {
                id: req.employee._id,
                name: req.employee.name,
                email: req.employee.email,
                employeeId: req.employee.employeeId,
                phone: req.employee.phone,
                department: req.employee.department,
                designation: req.employee.designation,
                joiningDate: req.employee.joiningDate,
                address: req.employee.address,
                image: req.employee.image,
            },
        });
    } catch (err) {
        console.error("getEmployeeProfile error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

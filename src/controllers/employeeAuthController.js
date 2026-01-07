import Employee from "../models/Employee.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

/* ================= EMPLOYEE LOGIN ================= */
export const employeeLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });

    const employee = await Employee.findOne({ email });
    if (!employee)
      return res.status(401).json({ message: "Invalid email or password" });

    let isPasswordValid = false;

    // Case 1: bcrypt hash
    if (employee.password.startsWith("$2")) {
      isPasswordValid = await bcrypt.compare(password, employee.password);
    }

    // Case 2: legacy plain-text → auto-upgrade
    if (!isPasswordValid && employee.password === password) {
      isPasswordValid = true;
      employee.password = await bcrypt.hash(password, 10);
      await employee.save();
    }

    if (!isPasswordValid)
      return res.status(401).json({ message: "Invalid email or password" });

    const token = generateToken(employee._id);

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
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= EMPLOYEE PROFILE ================= */
export const getEmployeeProfile = async (req, res) => {
  try {
    if (!req.employee)
      return res.status(401).json({ message: "Not authenticated" });

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
    res.status(500).json({ message: "Server error" });
  }
};

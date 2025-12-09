import jwt from "jsonwebtoken";
import Employee from "../models/Employee.js";

const employeeAuthMiddleware = async (req, res, next) => {
  try {
    let token;

    // 1️⃣ Check Authorization Header (Mobile App usage)
    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 2️⃣ Check Cookie (Web usage)
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    // 3️⃣ No Token → Block Access
    if (!token) {
      return res.status(401).json({
        message: "Not authorized, token missing"
      });
    }

    // 4️⃣ Verify Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5️⃣ Find employee in DB
    const employee = await Employee.findById(decoded.id).select("-password");
    if (!employee) {
      return res.status(401).json({
        message: "Not authorized, employee not found"
      });
    }

    // 6️⃣ Save employee in request for controllers
    req.employee = employee;

    next();
  } catch (err) {
    console.error("Employee Auth Error:", err.message);
    return res.status(401).json({
      message: "Not authorized, token invalid"
    });
  }
};

export default employeeAuthMiddleware;

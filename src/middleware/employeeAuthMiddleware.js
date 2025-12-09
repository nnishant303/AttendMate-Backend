import jwt from "jsonwebtoken";
import Employee from "../models/Employee.js";

const employeeAuthMiddleware = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        message: "Not authorized, token missing"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const employee = await Employee.findById(decoded.id).select("-password");
    if (!employee) {
      return res.status(401).json({
        message: "Not authorized, employee not found"
      });
    }

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

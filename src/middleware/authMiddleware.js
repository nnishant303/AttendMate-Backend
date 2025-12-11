import jwt from "jsonwebtoken";
import User from "../models/User.js";

const authMiddleware = async (req, res, next) => {
  try {
    let token;

    if (req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Try JWT authentication first
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select("-password");

        if (req.user) {
          return next();
        }
      } catch (jwtError) {
        console.log("JWT verification failed, checking session...");
      }
    }

    // Fallback to session authentication
    if (req.session && req.session.userId) {
      req.user = await User.findById(req.session.userId).select("-password");

      if (req.user) {
        return next();
      }
    }

    // No valid authentication found
    return res.status(401).json({ message: "Not authorized, no valid authentication" });
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Not authorized, authentication failed" });
  }
};

export default authMiddleware;

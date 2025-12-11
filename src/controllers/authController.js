import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

// POST /api/auth/register
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "Missing fields" });

    const existed = await User.findOne({ email });
    if (existed) return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role: role || "employee" });

    const token = generateToken(user._id);
    res.cookie("token", token, cookieOptions);

    // Store user in session for persistence
    req.session.userId = user._id.toString();
    req.session.user = { id: user._id, name: user.name, email: user.email, role: user.role };

    // Send limited user info
    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token,
    });
  } catch (err) {
    console.error("registerUser error:", err);
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("[authController] loginUser called", { email: email || null });
    if (!email || !password) return res.status(400).json({ message: "Missing credentials" });

    const user = await User.findOne({ email });
    console.log("[authController] found user:", !!user, user ? { id: user._id, role: user.role } : null);
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const hasPassword = !!user.password;
    console.log("[authController] User has password in DB:", hasPassword);

    const match = await bcrypt.compare(password, user.password || "");
    console.log("[authController] Password match result:", match);

    if (!match) return res.status(400).json({ message: "Invalid email or password" });

    const token = generateToken(user._id);
    res.cookie("token", token, cookieOptions);

    // Store user in session for persistence
    req.session.userId = user._id.toString();
    req.session.user = { id: user._id, name: user.name, email: user.email, role: user.role };

    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role }, token });
  } catch (err) {
    console.error("loginUser error:", err);
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/google
export const googleLogin = async (req, res) => {
  try {
    const tokenId = req.body.idToken || req.body.tokenId;
    if (!tokenId) return res.status(400).json({ message: "Google token required" });

    const ticket = await client.verifyIdToken({ idToken: tokenId, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const { email, name, picture, sub } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ name, email, googleId: sub, picture, role: "employee" });
    } else if (!user.googleId) {
      user.googleId = sub;
      await user.save();
    }

    const token = generateToken(user._id);
    res.cookie("token", token, cookieOptions);

    // Store user in session for persistence
    req.session.userId = user._id.toString();
    req.session.user = { id: user._id, name: user.name, email: user.email, role: user.role };

    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role }, token });
  } catch (err) {
    console.error("googleLogin error:", err);
    res.status(400).json({ message: "Google login failed", error: err.message });
  }
};

// POST /api/auth/logout
export const logoutUser = (req, res) => {
  res.cookie("token", "", { httpOnly: true, expires: new Date(0) });

  // Destroy session
  req.session.destroy((err) => {
    if (err) console.error("Session destroy error:", err);
  });

  res.json({ message: "Logged out" });
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    res.json({ user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role } });
  } catch (err) {
    console.error("getMe error:", err);
    res.status(500).json({ message: err.message });
  }
};

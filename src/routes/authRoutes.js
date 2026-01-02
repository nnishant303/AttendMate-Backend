import express from "express";
import {
    registerUser,
    loginUser,
    googleLogin,
    logoutUser,
    getMe,
} from "../controllers/authController.js";
import {
    sendOtp,
    verifyOtp,
    resetPassword
} from "../controllers/forgotPasswordController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleLogin);
router.post("/logout", logoutUser);
router.get("/me", authMiddleware, getMe);

// Forgot Password Routes
router.post("/forgot-password/send-otp", sendOtp);
router.post("/forgot-password/verify-otp", verifyOtp);
router.post("/forgot-password/reset", resetPassword);

export default router;

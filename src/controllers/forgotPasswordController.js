import User from "../models/User.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendEmail } from "../utils/emailService.js";

// Utility to generate a 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// POST /api/auth/forgot-password/send-otp
export const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required" });

        const user = await User.findOne({ email });

        // Security: In this specific case, the user requested explicit feedback
        if (!user) {
            return res.status(404).json({ message: "Email is not registered" });
        }

        // Rate Limiting: Check if OTP was sent recently (e.g., in the last 60 seconds)
        if (user.otpLastSent && (Date.now() - user.otpLastSent < 60 * 1000)) {
            const waitTime = Math.ceil((60 * 1000 - (Date.now() - user.otpLastSent)) / 1000);
            return res.status(429).json({ message: `Please wait ${waitTime} seconds before requesting a new OTP.` });
        }

        // Generate and Hash OTP
        const otp = generateOTP();
        console.log("Generated OTP for " + email + ":", otp); // Log for testing
        const salt = await bcrypt.genSalt(10);
        const hashedOtp = await bcrypt.hash(otp, salt);

        // Set Expiry (10 minutes)
        const otpExpires = Date.now() + 10 * 60 * 1000;

        // Update User
        user.otp = hashedOtp;
        user.otpExpires = otpExpires;
        user.otpAttempts = 0; // Reset attempts
        user.otpLastSent = Date.now();
        await user.save();

        // Send Email
        const message = `Your password reset OTP is: ${otp}. It expires in 10 minutes.`;
        try {
            const info = await sendEmail({
                to: user.email,
                subject: "Password Reset OTP",
                text: message,
                html: `<p>Your password reset OTP is: <b>${otp}</b></p><p>It expires in 10 minutes.</p>`,
            });

            // If it's a mock or test account, provide that info in the response
            const isMock = info.messageId.startsWith("mock-id-");
            const previewUrl = info.preview || null;

            res.status(200).json({
                success: true,
                message: isMock ? "OTP generated (Check logs/debug)" : "OTP sent successfully to your email.",
                testMode: isMock,
                // FOR DEBUGGING ONLY: include the OTP in response if it's a mock or failure
                debugOtp: (isMock || !!info.otpUsed) ? (info.otpUsed || otp) : "******"
            });
        } catch (emailErr) {
            console.error("Critical: Email failed to send, but OTP is generated for " + email + ":", emailErr.message);
            // Even if email fails, we return the OTP in the JSON so the dev can proceed
            res.status(200).json({
                success: true,
                message: "OTP generated (Email delivery failed). Use debugOtp below.",
                debugOtp: otp,
                error: emailErr.message
            });
        }

    } catch (err) {
        console.error("sendOtp error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// POST /api/auth/forgot-password/verify-otp
export const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid request" });

        // Check if OTP exists and is not expired
        if (!user.otp || !user.otpExpires || user.otpExpires < Date.now()) {
            return res.status(400).json({ message: "OTP expired or invalid" });
        }

        // Check max attempts
        if (user.otpAttempts >= 5) {
            // Optionally clear OTP to force new request
            user.otp = undefined;
            user.otpExpires = undefined;
            await user.save();
            return res.status(400).json({ message: "Too many failed attempts. Please request a new OTP." });
        }

        // Verify OTP
        const isMatch = await bcrypt.compare(String(otp), user.otp);
        if (!isMatch) {
            user.otpAttempts += 1;
            await user.save();
            return res.status(400).json({ message: "Invalid OTP" });
        }

        // Generate Reset Token (short-lived, e.g., 15 mins)
        const resetToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = await bcrypt.hash(resetToken, 10); // Hash token for storage

        // Store hashed token, clear OTP
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
        user.otp = undefined; // Prevent reuse
        user.otpExpires = undefined;
        await user.save();

        res.json({ success: true, message: "OTP verified", resetToken });

    } catch (err) {
        console.error("verifyOtp error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// POST /api/auth/forgot-password/reset
export const resetPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const resetToken = req.body.resetToken || req.body.token;
        const newPassword = req.body.newPassword || req.body.password;

        if (!email || !resetToken || !newPassword) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (String(newPassword).length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid request" });

        // Check if token exists and is valid
        if (!user.resetPasswordToken || !user.resetPasswordExpires || user.resetPasswordExpires < Date.now()) {
            return res.status(400).json({ message: "Reset token expired or invalid" });
        }

        // Verify Reset Token
        const isTokenMatch = await bcrypt.compare(String(resetToken), user.resetPasswordToken);
        if (!isTokenMatch) {
            return res.status(400).json({ message: "Invalid reset token" });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update User
        user.password = hashedPassword;
        user.resetPasswordToken = undefined; // Invalidate token
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ success: true, message: "Password reset successfully. You can now login." });

    } catch (err) {
        console.error("resetPassword error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

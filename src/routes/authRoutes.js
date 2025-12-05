import express from "express";
import {
    registerUser,
    loginUser,
    googleLogin,
    logoutUser,
    getMe,
} from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleLogin);
router.post("/logout", logoutUser);
router.get("/me", authMiddleware, getMe);

export default router;

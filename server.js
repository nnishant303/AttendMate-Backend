import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./src/config/db.js";

// Routes
import authRoutes from "./src/routes/authRoutes.js";
import employeeRoutes from "./src/routes/employeeRoutes.js";
import attendanceRoutes from "./src/routes/attendanceRoutes.js";
import leaveRoutes from "./src/routes/leaveRoutes.js";
import eventRoutes from "./src/routes/eventRoutes.js";

dotenv.config();
connectDB();

const app = express();
const httpServer = createServer(app);

// Allow multiple frontend origins (comma-separated in env) e.g. "http://localhost:5174,http://localhost:5173"
const FRONTEND_URLS = (process.env.FRONTEND_URLS || "http://localhost:5174,http://localhost:5173").split(",").map(s => s.trim());

const io = new Server(httpServer, {
  cors: {
    origin: FRONTEND_URLS,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  },
});

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS options that validate origin against allowed list and echo back the origin
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g., server-to-server, curl)
    if (!origin) return callback(null, true);
    if (FRONTEND_URLS.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(helmet());
app.use(morgan("dev"));

// Attach io to req and app
app.use((req, res, next) => {
  req.io = io;
  next();
});
app.set("io", io);

// Health
app.get("/api/health", (req, res) => res.json({ ok: true, time: new Date() }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/events", eventRoutes);


app.use((req, res) => res.status(404).json({ message: "Route not found" }));

app.use((err, req, res, next) => {
  console.error(err.stack || err);
  res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
});

// Socket.io connection logging
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("subscribeToAttendance", (date) => {
    if (date) socket.join(`attendance_${date}`);
  });

  socket.on("subscribeToGlobal", () => {
    socket.join("global");
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));

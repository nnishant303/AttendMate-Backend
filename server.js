import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import session from "express-session";
import MongoStore from "connect-mongo";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js";
import employeeRoutes from "./src/routes/employeeRoutes.js";
import attendanceRoutes from "./src/routes/attendanceRoutes.js";
import leaveRoutes from "./src/routes/leaveRoutes.js";
import eventRoutes from "./src/routes/eventRoutes.js";
import notificationRoutes from "./src/routes/notificationRoutes.js";

dotenv.config();
connectDB();

const app = express();
const httpServer = createServer(app);

// --- CORS CONFIGURATION ---
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://localhost:8100",
  "http://localhost:8200",
  "https://localhost",
  "http://localhost",
];

// Add origins from environment variables if present
if (process.env.FRONTEND_URLS) {
  process.env.FRONTEND_URLS.split(",").forEach(url => {
    const trimmed = url.trim();
    if (trimmed && !ALLOWED_ORIGINS.includes(trimmed)) {
      ALLOWED_ORIGINS.push(trimmed);
    }
  });
}

const isOriginAllowed = (origin) => {
  if (!origin) return true; // Allow non-browser requests (like Postman)
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (origin.endsWith(".vercel.app")) return true; // Support dynamic Vercel previews
  if (origin.includes("localhost:")) return true; // Support any local port
  return false;
};

const corsOptions = {
  origin: function (origin, callback) {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      console.error("Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
};

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  },
});

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
// --- END CORS CONFIGURATION ---
app.use(helmet());
app.use(morgan("dev"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET || "supersecretkey",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

app.use((req, res, next) => {
  req.io = io;
  next();
});
app.set("io", io);

app.get("/api/health", (req, res) => res.json({ ok: true, time: new Date() }));

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/notifications", notificationRoutes);


app.use((req, res) => res.status(404).json({ message: "Route not found" }));

app.use((err, req, res, next) => {
  console.error(err.stack || err);
  res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("subscribeToAttendance", (date) => {
    if (date) socket.join(`attendance_${date}`);
  });

  socket.on("subscribeToGlobal", () => {
    socket.join("global");
  });

  socket.on("subscribeToNotifications", (data) => {
    const { recipientType, recipientId } = data;
    if (recipientType && recipientId) {
      socket.join(`notification_${recipientType}_${recipientId}`);
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));

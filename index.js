const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const chatRoutes = require("./routes/chat");
const eventRoutes = require("./routes/events");
const waitlistRoutes = require("./routes/waitlist");
const authRoutes = require("./routes/auth");

// Load env variables early
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

const db = require("./models");
db.sequelize
  .sync()
  .then(() => {
    console.log("Synced db.");
  })
  .catch((err) => {
    console.log("Failed to sync db: " + err.message);
  });

// Configure CORS
// Allowed origins for CORS
const allowedOrigins = [
  "https://consergio-mvp-frontend.vercel.app", // Add your domains here
];

// CORS Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g., mobile apps or Postman)
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // Allow credentials (cookies, headers, etc.)
  })
);

// Handle preflight OPTIONS requests
app.options("*", cors());

app.use(express.json());

// Routes
app.use("/api/chat", chatRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/waitlist", waitlistRoutes);
app.use("/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

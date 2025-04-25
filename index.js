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
  "https://www.conserg.io", // Add your domains here
  "https://www.letsgo.events", // Add your domains here
];

// CORS Middleware with more comprehensive configuration
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
  })
);

// Handle preflight requests
app.options("*", cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Routes
app.use("/api/chat", chatRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/waitlist", waitlistRoutes);
app.use("/auth", authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  if (err.message.includes("CORS")) {
    // Handle CORS errors specifically
    return res.status(403).json({ error: err.message });
  }
  // Handle other errors
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

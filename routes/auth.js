const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Sync user with database (create or update)
router.post("/sync", authController.syncUser);

// Get user by ID
router.get("/users/:userId", authController.getUserById);

// Update user profile
router.put("/users/:userId", authController.updateUser);

// Delete user account
router.delete("/users/:userId", authController.deleteUser);

module.exports = router;
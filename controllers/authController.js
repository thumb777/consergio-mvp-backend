const db = require("../models");
const User = db.user; // Assuming you have a User model

/**
 * Sync user with database (create if new, update if existing)
 */
exports.syncUser = async (req, res) => {
  try {
    const { id, email, firstName, lastName, profileImage } = req.body;

    if (!id || !email) {
      return res.status(400).json({ message: "User ID and email are required" });
    }

    // Check if the user already exists
    let user = await User.findOne({ where: { id } });
    
    if (user) {
      // Update existing user
      user = await user.update({
        email,
        firstName,
        lastName,
        profileImage,
      });
      
      return res.status(200).json({ 
        message: "User updated successfully", 
        user 
      });
    } else {
      // Create a new user
      user = await User.create({
        id,
        email,
        firstName,
        lastName,
        profileImage,
      });
      
      return res.status(201).json({ 
        message: "User registered successfully", 
        user 
      });
    }
  } catch (error) {
    console.error("Error syncing user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get user by ID
 */
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findOne({ where: { id: userId } });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Update user profile
 */
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, profileImage } = req.body;
    
    const user = await User.findOne({ where: { id: userId } });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Update user fields
    await user.update({
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      profileImage: profileImage || user.profileImage,
    });
    
    res.status(200).json({ message: "User updated successfully", user });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Delete user
 */
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findOne({ where: { id: userId } });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    await user.destroy();
    
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const authenticateToken = require("./authenticationmiddleware");

const router = express.Router();
const User = mongoose.model("User");
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key";

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: "Please provide email, password and role." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // super-admin can bypass role constraint
    if (user.role !== "super-admin" && user.role !== role) {
      return res.status(401).json({ error: "Unauthorized access for this role." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    if (user.role === "admin" && user.authoritiesEnabled === false) {
      return res.status(403).json({ error: "Your account is disabled." });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      user: { email: user.email, role: user.role, name: user.name },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// GET /api/auth/admins — list all admins (super-admin only)
router.get("/admins", authenticateToken, async (req, res) => {
  if (req.user.role !== "super-admin") {
    return res.status(403).json({ error: "Access denied." });
  }
  try {
    const Settings = mongoose.model("Settings");
    const admins = await User.find({ role: "admin" }).select("-password");

    const adminsWithRestaurants = await Promise.all(
      admins.map(async (admin) => {
        const settings = await Settings.findOne({ adminId: admin._id.toString() });
        return {
          _id: admin._id,
          name: admin.name,
          email: admin.email,
          createdAt: admin.createdAt,
          restaurantName: settings ? settings.restaurantName : "Not Configured",
          subscriptionPaid: admin.subscriptionPaid !== undefined ? admin.subscriptionPaid : true,
          authoritiesEnabled: admin.authoritiesEnabled !== undefined ? admin.authoritiesEnabled : true,
        };
      })
    );
    res.json(adminsWithRestaurants);
  } catch (err) {
    console.error("Get admins error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// PATCH /api/auth/admins/:id — toggle admin subscription/authorities (super-admin only)
router.patch("/admins/:id", authenticateToken, async (req, res) => {
  if (req.user.role !== "super-admin") {
    return res.status(403).json({ error: "Access denied." });
  }
  try {
    const { subscriptionPaid, authoritiesEnabled } = req.body;
    const update = {};
    if (subscriptionPaid !== undefined) update.subscriptionPaid = subscriptionPaid;
    if (authoritiesEnabled !== undefined) update.authoritiesEnabled = authoritiesEnabled;

    const admin = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select("-password");
    if (!admin) return res.status(404).json({ error: "Admin not found." });

    res.json({ success: true, admin });
  } catch (err) {
    console.error("Update admin error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// POST /api/auth/register — register new admin (super-admin only)
router.post("/register", authenticateToken, async (req, res) => {
  if (req.user.role !== "super-admin") {
    return res.status(403).json({ error: "Access denied." });
  }
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email and password are required." });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: "Email already registered." });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashed,
      role: "admin",
      createdAt: new Date().toISOString(),
      subscriptionPaid: true,
      authoritiesEnabled: true,
    });
    await user.save();

    res.status(201).json({ success: true, user: { _id: user._id, name, email, role: "admin" } });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// DELETE /api/auth/admins/:id — delete admin (super-admin only)
router.delete("/admins/:id", authenticateToken, async (req, res) => {
  if (req.user.role !== "super-admin") {
    return res.status(403).json({ error: "Access denied." });
  }
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete admin error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;

const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

const safeUser = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  return obj;
};

// Coerce value to a plain string to prevent NoSQL operator injection.
// Returns an empty string for null/undefined.
const toStr = (val) => (val !== undefined && val !== null ? String(val) : "");

// Validate that a value is a legitimate MongoDB ObjectId string
const isValidObjectId = (val) => mongoose.Types.ObjectId.isValid(String(val));

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (!["parent", "child"].includes(role)) {
      return res.status(400).json({ error: "Role must be 'parent' or 'child'" });
    }
    const safeEmail = toStr(email).toLowerCase().trim();
    const existing = await User.findOne({ email: safeEmail });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }
    const user = await User.create({
      name: toStr(name).trim(),
      email: safeEmail,
      password: toStr(password),
      role,
    });
    const token = signToken(user._id);
    res.status(201).json({ user: safeUser(user), token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const safeEmail = toStr(email).toLowerCase().trim();
    const user = await User.findOne({ email: safeEmail });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const isMatch = await user.comparePassword(toStr(password));
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });
    const token = signToken(user._id);
    res.json({ user: safeUser(user), token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.linkChild = async (req, res) => {
  try {
    if (req.user.role !== "parent") {
      return res.status(403).json({ error: "Only parents can link children" });
    }
    const { childEmail } = req.body;
    if (!childEmail) return res.status(400).json({ error: "childEmail is required" });
    const safeEmail = toStr(childEmail).toLowerCase().trim();
    const child = await User.findOne({ email: safeEmail, role: "child" });
    if (!child) return res.status(404).json({ error: "Child account not found" });
    child.linkedParent = req.user._id;
    await child.save();
    res.json({ message: "Child linked successfully", child: safeUser(child) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateDeviceStatus = async (req, res) => {
  try {
    const { batteryLevel, deviceToken } = req.body;
    // Build a safe $set update with only known scalar fields
    const setFields = { lastActive: new Date() };
    if (batteryLevel !== undefined) {
      const level = Number(batteryLevel);
      if (!isNaN(level) && level >= 0 && level <= 100) setFields.batteryLevel = level;
    }
    if (deviceToken !== undefined) {
      // Allow only alphanumeric + common push-token characters
      const safeToken = toStr(deviceToken).replace(/[^a-zA-Z0-9\-_:.]/g, "");
      setFields.deviceToken = safeToken;
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: setFields },
      { new: true, select: "-password" }
    );
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.toggleTracking = async (req, res) => {
  try {
    if (req.user.role !== "parent") {
      return res.status(403).json({ error: "Only parents can toggle tracking" });
    }
    const { childId } = req.body;
    if (!childId) return res.status(400).json({ error: "childId is required" });
    if (!isValidObjectId(childId)) {
      return res.status(400).json({ error: "Invalid childId format" });
    }
    const childObjectId = new mongoose.Types.ObjectId(String(childId));
    const child = await User.findOne({
      _id: childObjectId,
      role: "child",
      linkedParent: req.user._id,
    });
    if (!child) return res.status(404).json({ error: "Linked child not found" });
    child.isTrackingPaused = !child.isTrackingPaused;
    await child.save();
    res.json({ isTrackingPaused: child.isTrackingPaused, child: safeUser(child) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.grantConsent = async (req, res) => {
  try {
    if (req.user.role !== "child") {
      return res.status(403).json({ error: "Only children can grant consent" });
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { trackingConsent: true } },
      { new: true, select: "-password" }
    );
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

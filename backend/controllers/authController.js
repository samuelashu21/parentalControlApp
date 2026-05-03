const jwt = require("jsonwebtoken");
const User = require("../models/User");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

const safeUser = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  return obj;
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (!["parent", "child"].includes(role)) {
      return res.status(400).json({ error: "Role must be 'parent' or 'child'" });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }
    const user = await User.create({ name, email, password, role });
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
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const isMatch = await user.comparePassword(password);
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
    const child = await User.findOne({ email: childEmail, role: "child" });
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
    const update = { lastActive: new Date() };
    if (batteryLevel !== undefined) update.batteryLevel = batteryLevel;
    if (deviceToken !== undefined) update.deviceToken = deviceToken;
    const user = await User.findByIdAndUpdate(req.user._id, update, {
      new: true,
      select: "-password",
    });
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
    const child = await User.findOne({
      _id: childId,
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
      { trackingConsent: true },
      { new: true, select: "-password" }
    );
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const Location = require("../models/Location");
const User = require("../models/User");

exports.addLocation = async (req, res) => {
  try {
    if (req.user.role !== "child") {
      return res
        .status(403)
        .json({ error: "Only children can submit locations" });
    }
    if (req.user.isTrackingPaused) {
      return res.status(403).json({ error: "Tracking is currently paused" });
    }
    const { latitude, longitude, accuracy } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return res
        .status(400)
        .json({ error: "latitude and longitude are required" });
    }
    const location = await Location.create({
      childId: req.user._id,
      latitude,
      longitude,
      accuracy,
    });
    res.status(201).json({ location });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getLocationHistory = async (req, res) => {
  try {
    const { childId } = req.params;
    const { from, to } = req.query;

    // Verify the requester is authorised (parent of child, or the child themselves)
    const child = await User.findById(childId);
    if (!child) return res.status(404).json({ error: "Child not found" });
    if (
      req.user.role === "parent" &&
      String(child.linkedParent) !== String(req.user._id)
    ) {
      return res
        .status(403)
        .json({ error: "Not authorised to view this child's locations" });
    }
    if (req.user.role === "child" && String(req.user._id) !== String(childId)) {
      return res.status(403).json({ error: "Not authorised" });
    }

    const filter = { childId };
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(to);
    }

    const locations = await Location.find(filter)
      .sort({ timestamp: -1 })
      .limit(1000);
    res.json({ locations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getLatestLocation = async (req, res) => {
  try {
    const { childId } = req.params;
    const child = await User.findById(childId);
    if (!child) return res.status(404).json({ error: "Child not found" });
    if (
      req.user.role === "parent" &&
      String(child.linkedParent) !== String(req.user._id)
    ) {
      return res
        .status(403)
        .json({ error: "Not authorised to view this child's location" });
    }
    if (req.user.role === "child" && String(req.user._id) !== String(childId)) {
      return res.status(403).json({ error: "Not authorised" });
    }

    const location = await Location.findOne({ childId }).sort({
      timestamp: -1,
    });
    if (!location)
      return res.status(404).json({ error: "No location data found" });
    res.json({ location });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteLocationHistory = async (req, res) => {
  try {
    if (req.user.role !== "parent") {
      return res
        .status(403)
        .json({ error: "Only parents can delete location history" });
    }
    const { childId } = req.params;
    const child = await User.findById(childId);
    if (!child) return res.status(404).json({ error: "Child not found" });
    if (String(child.linkedParent) !== String(req.user._id)) {
      return res
        .status(403)
        .json({ error: "Not authorised to delete this child's locations" });
    }
    const result = await Location.deleteMany({ childId });
    res.json({
      message: "Location history deleted",
      count: result.deletedCount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const Geofence = require("../models/Geofence");

// Haversine formula – returns distance in meters between two lat/lng points
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in metres
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

exports.createGeofence = async (req, res) => {
  try {
    if (req.user.role !== "parent") {
      return res
        .status(403)
        .json({ error: "Only parents can create geofences" });
    }
    const { name, latitude, longitude, radius } = req.body;
    if (!name || latitude === undefined || longitude === undefined || !radius) {
      return res
        .status(400)
        .json({ error: "name, latitude, longitude, and radius are required" });
    }
    const geofence = await Geofence.create({
      parentId: req.user._id,
      name,
      latitude,
      longitude,
      radius,
    });
    res.status(201).json({ geofence });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getGeofences = async (req, res) => {
  try {
    if (req.user.role !== "parent") {
      return res.status(403).json({ error: "Only parents can view geofences" });
    }
    const geofences = await Geofence.find({ parentId: req.user._id }).sort({
      createdAt: -1,
    });
    res.json({ geofences });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateGeofence = async (req, res) => {
  try {
    const geofence = await Geofence.findOne({
      _id: req.params.id,
      parentId: req.user._id,
    });
    if (!geofence) return res.status(404).json({ error: "Geofence not found" });
    const { name, latitude, longitude, radius, isActive } = req.body;
    if (name !== undefined) geofence.name = name;
    if (latitude !== undefined) geofence.latitude = latitude;
    if (longitude !== undefined) geofence.longitude = longitude;
    if (radius !== undefined) geofence.radius = radius;
    if (isActive !== undefined) geofence.isActive = isActive;
    await geofence.save();
    res.json({ geofence });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteGeofence = async (req, res) => {
  try {
    const geofence = await Geofence.findOneAndDelete({
      _id: req.params.id,
      parentId: req.user._id,
    });
    if (!geofence) return res.status(404).json({ error: "Geofence not found" });
    res.json({ message: "Geofence deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.checkGeofence = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return res
        .status(400)
        .json({ error: "latitude and longitude are required" });
    }
    const geofences = await Geofence.find({
      parentId: req.user._id,
      isActive: true,
    });
    const results = geofences.map((fence) => {
      const dist = haversineDistance(
        latitude,
        longitude,
        fence.latitude,
        fence.longitude,
      );
      return {
        geofence: fence,
        distance: Math.round(dist),
        inside: dist <= fence.radius,
      };
    });
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  accuracy: Number,
  timestamp: { type: Date, default: Date.now },
});

locationSchema.index({ childId: 1, timestamp: -1 });

module.exports = mongoose.model("Location", locationSchema);

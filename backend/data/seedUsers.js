const mongoose = require("mongoose");
const User = require("./models/User"); // adjust path if needed

mongoose
  .connect("mongodb://127.0.0.1:27017/parentalcontrol", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("MongoDB Connected");

    // Clear old sample users (optional)
    await User.deleteMany({});

    // Create parent users
    const parent1 = await User.create({
      name: "John Doe",
      email: "john@example.com",
      password: "123456",
      role: "parent",
      deviceToken: "parent-device-token-1",
      batteryLevel: 90,
      lastActive: new Date(),
      trackingConsent: true,
    });

    const parent2 = await User.create({
      name: "Sarah Smith",
      email: "sarah@example.com",
      password: "123456",
      role: "parent",
      deviceToken: "parent-device-token-2",
      batteryLevel: 75,
      lastActive: new Date(),
      trackingConsent: true,
    });

    // Create child users linked to parents
    const child1 = await User.create({
      name: "Michael Doe",
      email: "michael@example.com",
      password: "123456",
      role: "child",
      linkedParent: parent1._id,
      deviceToken: "child-device-token-1",
      batteryLevel: 60,
      lastActive: new Date(),
      isTrackingPaused: false,
      trackingConsent: true,
    });

    const child2 = await User.create({
      name: "Emma Doe",
      email: "emma@example.com",
      password: "123456",
      role: "child",
      linkedParent: parent1._id,
      deviceToken: "child-device-token-2",
      batteryLevel: 45,
      lastActive: new Date(),
      isTrackingPaused: true,
      trackingConsent: true,
    });

    const child3 = await User.create({
      name: "Daniel Smith",
      email: "daniel@example.com",
      password: "123456",
      role: "child",
      linkedParent: parent2._id,
      deviceToken: "child-device-token-3",
      batteryLevel: 88,
      lastActive: new Date(),
      isTrackingPaused: false,
      trackingConsent: true,
    });

    const admin = await User.create({
      name: "Michael Doe",
      email: "michael@example.com",
      password: "123456",
      role: "admin",
      linkedParent: parent1._id,
      deviceToken: "admin-device-token-1",
      batteryLevel: 60,
      lastActive: new Date(),
      isTrackingPaused: false,
      trackingConsent: true,
    });

    console.log("Sample users inserted successfully");
    console.log({
      parent1,
      parent2,
      child1,
      child2,
      child3,
    });

    process.exit();
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

const router = require("express").Router();
const ctrl = require("../controllers/geofenceController");
const auth = require("../middleware/auth");

router.post("/check", auth, ctrl.checkGeofence);
router.post("/", auth, ctrl.createGeofence);
router.get("/", auth, ctrl.getGeofences);
router.put("/:id", auth, ctrl.updateGeofence);
router.delete("/:id", auth, ctrl.deleteGeofence);

module.exports = router;

const router = require("express").Router();
const ctrl = require("../controllers/locationController");
const auth = require("../middleware/auth");

router.post("/", auth, ctrl.addLocation);
router.get("/:childId/latest", auth, ctrl.getLatestLocation);
router.get("/:childId", auth, ctrl.getLocationHistory);
router.delete("/:childId", auth, ctrl.deleteLocationHistory);

module.exports = router;

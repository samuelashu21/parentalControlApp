const router = require("express").Router();
const ctrl = require("../controllers/authController");
const auth = require("../middleware/auth");

router.post("/register", ctrl.register);
router.post("/login", ctrl.login);
router.get("/profile", auth, ctrl.getProfile);
router.post("/link-child", auth, ctrl.linkChild);
router.patch("/device-status", auth, ctrl.updateDeviceStatus);
router.patch("/toggle-tracking", auth, ctrl.toggleTracking);
router.patch("/grant-consent", auth, ctrl.grantConsent);
router.get("/admin/users", auth, ctrl.listManagedUsers);
router.delete("/admin/users/:userId", auth, ctrl.deleteManagedUser);

module.exports = router;

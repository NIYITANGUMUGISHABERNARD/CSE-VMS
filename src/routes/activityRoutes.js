const express = require("express");

const router = express.Router();

const {
    authenticateToken
} = require("../middleware/authMiddleware");

const {
    requirePermission
} = require("../middleware/permissionMiddleware");

const {
    getActivities
} = require("../controllers/activityController");


router.get(
    "/",
    authenticateToken,
    requirePermission("MONITOR_ACTIVITIES"),
    getActivities
);


module.exports = router;
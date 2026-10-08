const express = require("express");

const {
    authenticateToken
} = require("../middleware/authMiddleware");

const {
    getMyNotifications
} = require("../controllers/notificationController");

const router = express.Router();

router.get(
    "/",
    authenticateToken,
    getMyNotifications
);

module.exports = router;

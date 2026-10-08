const express = require("express");

const {
    authenticateToken
} = require("../middleware/authMiddleware");

const {
    getSystemSummaryReport
} = require("../controllers/reportController");

const router = express.Router();

router.get(
    "/summary",
    authenticateToken,
    getSystemSummaryReport
);

module.exports = router;

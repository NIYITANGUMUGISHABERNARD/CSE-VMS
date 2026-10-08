require("dotenv").config();

const express = require("express");
const path = require("path");

// ===============================
// ROUTES
// ===============================

const authRoutes = require("./src/routes/authRoutes");
const testRoutes = require("./src/routes/testRoutes");
const userRoutes = require("./src/routes/userRoutes");
const roleRoutes = require("./src/routes/roleRoutes");
const volunteerRoutes = require("./src/routes/volunteerRoutes");
const communityRoutes = require("./src/routes/communityRoutes");
const coordinatorRoutes = require("./src/routes/coordinatorRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const activityRoutes = require("./src/routes/activityRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");
const reportRoutes = require("./src/routes/reportRoutes");
const feedbackRoutes = require("./src/routes/feedbackRoutes");

// ===============================
// APP
// ===============================

const app = express();

const PORT = process.env.PORT || 3000;

// ===============================
// MIDDLEWARE
// ===============================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend files from public folder
app.use(express.static(path.join(__dirname, "public")));

// ===============================
// API ROUTES
// ===============================

app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/volunteer", volunteerRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/coordinator", coordinatorRoutes);
app.use("/api/admin", adminRoutes);

// Activities API
app.use("/api/activities", activityRoutes);

// Notifications API
app.use("/api/notifications", notificationRoutes);

// Reports API
app.use("/api/reports", reportRoutes);

// Feedback API
app.use("/api/feedback", feedbackRoutes);

// ===============================
// ROOT ROUTE
// ===============================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "CSE-VMS API is running."
    });
});

// ===============================
// 404 ROUTE
// ===============================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found."
    });
});

// ===============================
// ERROR HANDLER
// ===============================

app.use((err, req, res, next) => {
    console.error("Server error:", err);

    res.status(500).json({
        success: false,
        message: "Internal server error."
    });
});

// ===============================
// START SERVER
// ===============================

const server = app.listen(PORT, "127.0.0.1", () => {
    console.log(
        `CSE-VMS server is running on http://127.0.0.1:${PORT}`
    );
});

server.on("error", (error) => {
    console.error("SERVER ERROR:", error);
});

// ===============================
// SERVER STATUS
// ===============================

setInterval(() => {
    console.log("CSE-VMS server is still running...");
}, 5000);
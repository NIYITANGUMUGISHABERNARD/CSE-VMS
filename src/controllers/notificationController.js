const db = require("../config/database");

async function getMyNotifications(req, res) {
    try {
        const userId = req.user.id;

        const [notifications] = await db.execute(
            `SELECT
                id,
                user_id,
                title,
                message,
                type,
                is_read,
                created_at
             FROM notifications
             WHERE user_id = ?
             ORDER BY created_at DESC`,
            [userId]
        );

        return res.status(200).json({
            success: true,
            message: "Notifications retrieved successfully.",
            count: notifications.length,
            notifications
        });

    } catch (error) {
        console.error(
            "Get notifications error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while retrieving notifications."
        });
    }
}

module.exports = {
    getMyNotifications
};

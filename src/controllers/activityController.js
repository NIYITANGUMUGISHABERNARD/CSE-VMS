const db = require("../config/database");

async function getActivities(req, res) {
    try {
        const [activities] = await db.execute(`
            SELECT
                al.id,
                al.user_id,
                u.full_name AS user_name,
                u.email AS user_email,
                r.role_name AS role_name,
                al.action,
                al.description,
                al.created_at
            FROM activity_logs al
            INNER JOIN users u
                ON u.id = al.user_id
            LEFT JOIN roles r
                ON r.id = u.role_id
            ORDER BY al.created_at DESC
        `);

        return res.status(200).json({
            success: true,
            message: "Activities retrieved successfully.",
            count: activities.length,
            activities
        });

    } catch (error) {
        console.error("Get activities error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while retrieving activities."
        });
    }
}

module.exports = {
    getActivities
};

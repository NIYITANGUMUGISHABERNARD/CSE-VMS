const db = require("../config/database");

async function notifyAdmins(title, message, type = "System") {
    try {
        const [admins] = await db.execute(
            `SELECT id
             FROM users
             WHERE role_id = 1
               AND status = 'Active'`
        );

        for (const admin of admins) {
            await db.execute(
                `INSERT INTO notifications
                    (
                        user_id,
                        title,
                        message,
                        type
                    )
                 VALUES (?, ?, ?, ?)`,
                [
                    admin.id,
                    title,
                    message,
                    type
                ]
            );
        }
    } catch (error) {
        console.error("Admin notification error:", error);
    }
}

module.exports = {
    notifyAdmins
};

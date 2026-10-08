const db = require("../config/database");

async function getSystemSummaryReport(req, res) {
    try {
        const [users] = await db.execute(
            `SELECT COUNT(*) AS total_users
             FROM users`
        );

        const [volunteers] = await db.execute(
            `SELECT COUNT(*) AS total_volunteers
             FROM volunteer_profiles`
        );

        const [communityMembers] = await db.execute(
            `SELECT COUNT(*) AS total_community_members
             FROM community_profiles`
        );

        const [skills] = await db.execute(
            `SELECT COUNT(*) AS total_skills
             FROM skills`
        );

        const [coordinators] = await db.execute(
            `SELECT COUNT(*) AS total_coordinators
             FROM users
             WHERE role_id = 2`
        );

        const [assignments] = await db.execute(
            `SELECT COUNT(*) AS total_assignments
             FROM assignments`
        );

        const [participations] = await db.execute(
            `SELECT COUNT(*) AS total_participations
             FROM participations`
        );

        const [notifications] = await db.execute(
            `SELECT COUNT(*) AS total_notifications
             FROM notifications`
        );

        return res.status(200).json({
            success: true,
            message: "System summary report generated successfully.",
            report: {
                total_users: users[0].total_users,

                total_volunteers:
                    volunteers[0].total_volunteers,

                total_community_members:
                    communityMembers[0].total_community_members,

                total_skills:
                    skills[0].total_skills,

                total_coordinators:
                    coordinators[0].total_coordinators,

                total_assignments:
                    assignments[0].total_assignments,

                total_participations:
                    participations[0].total_participations,

                total_notifications:
                    notifications[0].total_notifications
            }
        });

    } catch (error) {
        console.error(
            "System summary report error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while generating system summary report."
        });
    }
}

module.exports = {
    getSystemSummaryReport
};
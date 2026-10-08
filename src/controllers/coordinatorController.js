const pool = require("../config/database");


async function reviewVolunteerSkills(req, res) {
    try {
        const [volunteers] = await pool.query(`
            SELECT
                vp.id AS volunteer_id,
                u.id AS user_id,
                u.full_name,
                u.email,
                u.phone,
                s.id AS skill_id,
                s.skill_name,
                vs.experience_level,
                vs.description AS skill_description,
                vp.bio,
                vp.location AS volunteer_location,
                vp.availability
            FROM volunteer_profiles vp
            INNER JOIN users u
                ON vp.user_id = u.id
            LEFT JOIN volunteer_skills vs
                ON vp.id = vs.volunteer_id
            LEFT JOIN skills s
                ON vs.skill_id = s.id
            WHERE u.role_id = 3
              AND u.status = 'Active'
            ORDER BY u.full_name ASC
        `);

        return res.json({
            success: true,
            count: volunteers.length,
            volunteers
        });

    } catch (error) {
        console.error("Review Volunteer Skills Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while retrieving volunteer skills"
        });
    }
}


async function reviewCommunityNeeds(req, res) {
    try {
        const [needs] = await pool.query(`
            SELECT
                cn.id,
                cp.id AS community_profile_id,
                u.id AS community_member_user_id,
                u.full_name AS community_member_name,
                u.email AS community_member_email,
                cn.title,
                cn.description,
                cn.location,
                cn.urgency,
                cn.status,
                cn.required_skill_id,
                s.skill_name,
                cn.created_at
            FROM community_needs cn
            INNER JOIN community_profiles cp
                ON cn.community_member_id = cp.id
            INNER JOIN users u
                ON cp.user_id = u.id
            INNER JOIN skills s
                ON cn.required_skill_id = s.id
            ORDER BY cn.created_at DESC
        `);

        return res.json({
            success: true,
            count: needs.length,
            needs
        });

    } catch (error) {
        console.error("Review Community Needs Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while retrieving community needs"
        });
    }
}


async function matchVolunteer(req, res) {
    const connection = await pool.getConnection();

    try {
        const {
            need_id,
            volunteer_id,
            start_date,
            end_date,
            notes
        } = req.body;

        if (!need_id || !volunteer_id) {
            return res.status(400).json({
                success: false,
                message: "Need ID and Volunteer ID are required"
            });
        }

        await connection.beginTransaction();

        const [needs] = await connection.query(`
            SELECT
                id,
                title,
                location,
                required_skill_id,
                status
            FROM community_needs
            WHERE id = ?
            FOR UPDATE
        `, [need_id]);

        if (needs.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Community need not found"
            });
        }

        const need = needs[0];

        if (need.status !== "Open") {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "This community need is not open for matching"
            });
        }

        const [volunteers] = await connection.query(`
            SELECT
                vp.id AS volunteer_id,
                u.id AS user_id,
                u.full_name,
                u.status
            FROM volunteer_profiles vp
            INNER JOIN users u
                ON vp.user_id = u.id
            WHERE vp.id = ?
              AND u.role_id = 3
        `, [volunteer_id]);

        if (volunteers.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Volunteer not found"
            });
        }

        const volunteer = volunteers[0];

        if (volunteer.status !== "Active") {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "Volunteer is not active"
            });
        }

        const [skills] = await connection.query(`
            SELECT id
            FROM volunteer_skills
            WHERE volunteer_id = ?
              AND skill_id = ?
        `, [volunteer_id, need.required_skill_id]);

        if (skills.length === 0) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "Volunteer does not have the required skill"
            });
        }

        const [existingAssignments] = await connection.query(`
            SELECT id
            FROM assignments
            WHERE need_id = ?
              AND volunteer_id = ?
              AND status IN ('Assigned', 'Accepted')
        `, [need_id, volunteer_id]);

        if (existingAssignments.length > 0) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "This volunteer is already assigned to this community need"
            });
        }

        const [assignmentResult] = await connection.query(`
            INSERT INTO assignments
            (
                need_id,
                volunteer_id,
                coordinator_id,
                assigned_date,
                start_date,
                end_date,
                status,
                notes
            )
            VALUES (?, ?, ?, CURDATE(), ?, ?, 'Assigned', ?)
        `, [
            need_id,
            volunteer_id,
            req.user.id,
            start_date || null,
            end_date || null,
            notes || null
        ]);

        await connection.query(`
            UPDATE community_needs
            SET status = 'Matched'
            WHERE id = ?
        `, [need_id]);

        await connection.commit();

        /*
         * Notification and activity logging are secondary operations.
         * They must never undo a successfully created assignment.
         */
        try {
            await pool.query(`
                INSERT INTO notifications
                (
                    user_id,
                    title,
                    message,
                    type
                )
                VALUES (?, ?, ?, ?)
            `, [
                volunteer.user_id,
                "New Volunteer Assignment",
                `You have been assigned to community need "${need.title}" at ${need.location}.`,
                "Assignment"
            ]);
        } catch (notificationError) {
            console.error(
                "Assignment notification error:",
                notificationError
            );
        }

        try {
            await pool.query(`
                INSERT INTO activity_logs
                (
                    user_id,
                    action,
                    description
                )
                VALUES (?, ?, ?)
            `, [
                req.user.id,
                "MATCH_VOLUNTEER",
                `Volunteer ${volunteer.full_name} matched with community need ${need.title}`
            ]);
        } catch (activityError) {
            console.error(
                "Assignment activity log error:",
                activityError
            );
        }

        return res.status(201).json({
            success: true,
            message: "Volunteer matched successfully",
            assignment: {
                id: assignmentResult.insertId,
                need_id,
                volunteer_id,
                coordinator_id: req.user.id,
                status: "Assigned"
            }
        });

    } catch (error) {
        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error(
                "Match Volunteer Rollback Error:",
                rollbackError
            );
        }

        console.error("Match Volunteer Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while matching volunteer"
        });

    } finally {
        connection.release();
    }
}


async function manageAssignments(req, res) {
    try {
        const [assignments] = await pool.query(`
            SELECT
                a.id,
                a.need_id,
                cn.title AS need_title,
                cn.location,
                cn.urgency,
                a.volunteer_id,
                u.full_name AS volunteer_name,
                a.coordinator_id,
                a.assigned_date,
                a.start_date,
                a.end_date,
                a.status,
                a.notes,
                a.created_at,
                a.updated_at
            FROM assignments a
            INNER JOIN community_needs cn
                ON a.need_id = cn.id
            INNER JOIN volunteer_profiles vp
                ON a.volunteer_id = vp.id
            INNER JOIN users u
                ON vp.user_id = u.id
            ORDER BY a.created_at DESC
        `);

        return res.json({
            success: true,
            count: assignments.length,
            assignments
        });

    } catch (error) {
        console.error("Manage Assignments Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while retrieving assignments"
        });
    }
}


async function approveOrRejectAssignment(req, res) {
    try {
        const {
            assignment_id,
            action,
            notes
        } = req.body;

        if (!assignment_id || !action) {
            return res.status(400).json({
                success: false,
                message: "Assignment ID and action are required"
            });
        }

        const normalizedAction = String(action).toLowerCase();

        if (!["approve", "reject"].includes(normalizedAction)) {
            return res.status(400).json({
                success: false,
                message: "Action must be approve or reject"
            });
        }

        const [assignments] = await pool.query(`
            SELECT
                a.id,
                a.need_id,
                a.volunteer_id,
                a.coordinator_id,
                a.status,
                a.notes,
                cn.title AS need_title,
                u.id AS user_id,
                u.full_name AS volunteer_name,
                cm.id AS community_member_user_id,
                cm.full_name AS community_member_name
            FROM assignments a
            INNER JOIN community_needs cn
                ON a.need_id = cn.id
            INNER JOIN volunteer_profiles vp
                ON a.volunteer_id = vp.id
            INNER JOIN users u
                ON vp.user_id = u.id
            INNER JOIN community_profiles cp
                ON cn.community_member_id = cp.id
            INNER JOIN users cm
                ON cp.user_id = cm.id
            WHERE a.id = ?
        `, [assignment_id]);

        if (assignments.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found"
            });
        }

        const assignment = assignments[0];

        if (assignment.status !== "Assigned") {
            return res.status(400).json({
                success: false,
                message: `Assignment cannot be ${normalizedAction}d because its current status is ${assignment.status}`
            });
        }

        const newStatus =
            normalizedAction === "approve"
                ? "Accepted"
                : "Rejected";

        await pool.query(`
            UPDATE assignments
            SET
                status = ?,
                notes = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [
            newStatus,
            notes || assignment.notes || null,
            assignment_id
        ]);

        await pool.query(`
            INSERT INTO notifications
            (
                user_id,
                title,
                message,
                type
            )
            VALUES (?, ?, ?, ?)
        `, [
            assignment.user_id,
            normalizedAction === "approve"
                ? "Assignment Approved"
                : "Assignment Rejected",
            normalizedAction === "approve"
                ? `Your assignment for "${assignment.need_title}" has been approved.`
                : `Your assignment for "${assignment.need_title}" has been rejected.`,
            "Assignment"
        ]);

        await pool.query(`
            INSERT INTO activity_logs
            (
                user_id,
                action,
                description
            )
            VALUES (?, ?, ?)
        `, [
            req.user.id,
            normalizedAction === "approve"
                ? "APPROVE_ASSIGNMENT"
                : "REJECT_ASSIGNMENT",
            `Coordinator ${normalizedAction}d assignment ${assignment_id} for volunteer ${assignment.volunteer_name}`
        ]);

        return res.json({
            success: true,
            message: `Volunteer assignment ${normalizedAction}d successfully`,
            assignment_id,
            status: newStatus
        });

    } catch (error) {
        console.error("Approve/Reject Assignment Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while processing assignment"
        });
    }
}


async function recordParticipation(req, res) {
    try {
        const {
            assignment_id,
            volunteer_id,
            participation_date,
            status,
            notes
        } = req.body;

        const allowedStatuses = [
            "Present",
            "Absent",
            "Completed"
        ];

        if (
            !assignment_id ||
            !volunteer_id ||
            !participation_date ||
            !status
        ) {
            return res.status(400).json({
                success: false,
                message: "Assignment ID, Volunteer ID, participation date and status are required"
            });
        }

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid participation status"
            });
        }

        const [assignments] = await pool.query(`
            SELECT id, volunteer_id
            FROM assignments
            WHERE id = ?
        `, [assignment_id]);

        if (assignments.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found"
            });
        }

        if (Number(assignments[0].volunteer_id) !== Number(volunteer_id)) {
            return res.status(400).json({
                success: false,
                message: "Volunteer does not belong to this assignment"
            });
        }

        const [existingParticipation] = await pool.query(`
            SELECT id
            FROM participations
            WHERE assignment_id = ?
              AND participation_date = ?
        `, [
            assignment_id,
            participation_date
        ]);

        if (existingParticipation.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Participation already recorded for this date"
            });
        }

        const [result] = await pool.query(`
            INSERT INTO participations
            (
                assignment_id,
                volunteer_id,
                participation_date,
                status,
                notes
            )
            VALUES (?, ?, ?, ?, ?)
        `, [
            assignment_id,
            volunteer_id,
            participation_date,
            status,
            notes || null
        ]);

        await pool.query(`
            INSERT INTO activity_logs
            (
                user_id,
                action,
                description
            )
            VALUES (?, ?, ?)
        `, [
            req.user.id,
            "TRACK_PARTICIPATION",
            `Participation recorded for assignment ${assignment_id}`
        ]);

        return res.status(201).json({
            success: true,
            message: "Participation recorded successfully",
            participation_id: result.insertId
        });

    } catch (error) {
        console.error("Record Participation Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while recording participation"
        });
    }
}


module.exports = {
    reviewVolunteerSkills,
    reviewCommunityNeeds,
    matchVolunteer,
    manageAssignments,
    approveOrRejectAssignment,
    recordParticipation
};




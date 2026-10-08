const db = require("../config/database");

// =====================================================
// 1. GET COMPLETED / ASSIGNED SERVICES FOR FEEDBACK
// =====================================================

async function getFeedbackServices(req, res) {
    try {
        const [services] = await db.execute(
            `SELECT
                a.id AS assignment_id,
                a.status AS assignment_status,
                a.assigned_date,
                a.start_date,
                a.end_date,
                cn.id AS need_id,
                cn.title AS service_title,
                cn.description AS service_description,
                cn.location,
                u.id AS volunteer_user_id,
                u.full_name AS volunteer_name,
                u.email AS volunteer_email,
                f.id AS feedback_id,
                f.rating,
                f.comment
             FROM assignments a

             INNER JOIN community_needs cn
                ON a.need_id = cn.id

             INNER JOIN community_profiles cp
                ON cn.community_member_id = cp.id

             INNER JOIN volunteer_profiles vp
                ON a.volunteer_id = vp.id

             INNER JOIN users u
                ON vp.user_id = u.id

             LEFT JOIN feedback f
                ON f.assignment_id = a.id
               AND f.community_member_id = cp.id
               AND f.volunteer_id = vp.id

             WHERE cp.user_id = ?

             ORDER BY a.id DESC`,
            [req.user.id]
        );

        return res.status(200).json({
            success: true,
            message: "Services retrieved successfully.",
            count: services.length,
            services
        });

    } catch (error) {
        console.error(
            "Get feedback services error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while retrieving services."
        });
    }
}


// =====================================================
// 2. SUBMIT SERVICE FEEDBACK
// =====================================================

async function submitFeedback(req, res) {
    try {
        const {
            assignment_id,
            rating,
            comment
        } = req.body;

        // -------------------------------------------------
        // Validate required fields
        // -------------------------------------------------

        if (!assignment_id || !rating) {
            return res.status(400).json({
                success: false,
                message:
                    "Assignment ID and rating are required."
            });
        }

        // -------------------------------------------------
        // Validate rating
        // -------------------------------------------------

        const numericRating = Number(rating);

        if (
            !Number.isInteger(numericRating) ||
            numericRating < 1 ||
            numericRating > 5
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Rating must be a whole number between 1 and 5."
            });
        }

        // -------------------------------------------------
        // Find assignment belonging to logged-in
        // community member
        // -------------------------------------------------

        const [assignments] = await db.execute(
            `SELECT
                a.id AS assignment_id,
                a.volunteer_id,
                cp.id AS community_member_id,
                cp.user_id AS community_user_id
             FROM assignments a

             INNER JOIN community_needs cn
                ON a.need_id = cn.id

             INNER JOIN community_profiles cp
                ON cn.community_member_id = cp.id

             WHERE a.id = ?
               AND cp.user_id = ?`,
            [
                assignment_id,
                req.user.id
            ]
        );

        if (assignments.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Assignment not found or does not belong to this community member."
            });
        }

        const assignment = assignments[0];

        // -------------------------------------------------
        // Check whether feedback already exists
        // -------------------------------------------------

        const [existingFeedback] = await db.execute(
            `SELECT id
             FROM feedback
             WHERE assignment_id = ?
               AND community_member_id = ?
               AND volunteer_id = ?`,
            [
                assignment.assignment_id,
                assignment.community_member_id,
                assignment.volunteer_id
            ]
        );

        if (existingFeedback.length > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "Feedback has already been submitted for this service."
            });
        }

        // -------------------------------------------------
        // Insert feedback
        // -------------------------------------------------

        const [result] = await db.execute(
            `INSERT INTO feedback
                (
                    assignment_id,
                    community_member_id,
                    volunteer_id,
                    rating,
                    comment
                )
             VALUES (?, ?, ?, ?, ?)`,
            [
                assignment.assignment_id,
                assignment.community_member_id,
                assignment.volunteer_id,
                numericRating,
                comment || null
            ]
        );

        // -------------------------------------------------
        // Log activity
        // -------------------------------------------------

        await db.execute(
            `INSERT INTO activity_logs
                (
                    user_id,
                    action,
                    description
                )
             VALUES (?, ?, ?)`,
            [
                req.user.id,
                "SUBMIT_SERVICE_FEEDBACK",
                `Submitted service feedback for assignment ${assignment.assignment_id}. Rating: ${numericRating}/5.`
            ]
        );

        return res.status(201).json({
            success: true,
            message:
                "Service feedback submitted successfully.",
            feedback: {
                id: result.insertId,
                assignment_id: assignment.assignment_id,
                community_member_id:
                    assignment.community_member_id,
                volunteer_id:
                    assignment.volunteer_id,
                rating: numericRating,
                comment: comment || null
            }
        });

    } catch (error) {
        console.error(
            "Submit feedback error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while submitting feedback."
        });
    }
}


// =====================================================
// EXPORT FUNCTIONS
// =====================================================

module.exports = {
    getFeedbackServices,
    submitFeedback
};
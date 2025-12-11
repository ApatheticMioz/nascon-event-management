const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { isAuthenticated, hasPrivilege } = require('../middleware/auth');

// GET /judges - Render judges management page
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const judges = await executeQuery(`
            SELECT 
                j.JudgeID,
                j.UserID,
                j.Specialization,
                j.Status,
                u.Name,
                u.Email,
                COUNT(DISTINCT ej.EventID) as AssignedEvents
            FROM Judges j
            JOIN Users u ON j.UserID = u.UserID
            LEFT JOIN EventJudges ej ON j.JudgeID = ej.JudgeID
            GROUP BY j.JudgeID
            ORDER BY j.Status ASC, u.Name ASC
        `);

        res.render('judges', {
            title: 'Judges Management',
            judges: judges,
            user: req.user
        });
    } catch (error) {
        console.error('Error fetching judges:', error);
        res.status(500).render('error', {
            message: 'Error loading judges',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// GET /judges/add - Show judge creation form
router.get('/add', isAuthenticated, hasPrivilege('judges.create'), async (req, res) => {
    try {
        // Get users who are not already judges
        const users = await executeQuery(`
            SELECT u.UserID, u.Name, u.Email
            FROM Users u
            LEFT JOIN Judges j ON u.UserID = j.UserID
            WHERE j.JudgeID IS NULL
            ORDER BY u.Name
        `);

        res.render('judge-form', {
            title: 'Add Judge',
            users: users,
            judge: null,
            user: req.user
        });
    } catch (error) {
        console.error('Error loading judge form:', error);
        res.status(500).render('error', {
            message: 'Error loading judge form',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// POST /judges - Create new judge
router.post('/', isAuthenticated, hasPrivilege('judges.create'), async (req, res) => {
    try {
        const { userId, specialization } = req.body;

        // Check if user is already a judge
        const existingJudge = await executeQuery(
            'SELECT JudgeID FROM Judges WHERE UserID = ?',
            [userId]
        );

        if (existingJudge.length > 0) {
            return res.status(400).json({
                error: 'User is already a judge'
            });
        }

        // Create new judge
        const result = await executeQuery(`
            INSERT INTO Judges (UserID, Specialization, Status)
            VALUES (?, ?, 'active')
        `, [userId, specialization]);

        res.status(201).json({
            message: 'Judge created successfully',
            judgeId: result.insertId
        });
    } catch (error) {
        console.error('Error creating judge:', error);
        res.status(500).json({
            error: 'Failed to create judge'
        });
    }
});

// GET /judges/:id - Get judge details
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const [judge] = await executeQuery(`
            SELECT 
                j.*,
                u.Name,
                u.Email,
                u.Contact
            FROM Judges j
            JOIN Users u ON j.UserID = u.UserID
            WHERE j.JudgeID = ?
        `, [req.params.id]);

        if (!judge) {
            return res.status(404).json({
                error: 'Judge not found'
            });
        }

        // Get events assigned to judge
        const events = await executeQuery(`
            SELECT 
                e.EventID,
                e.Name as EventName,
                e.Date,
                e.Time,
                ej.AssignedAt,
                ej.Status as AssignmentStatus
            FROM EventJudges ej
            JOIN Events e ON ej.EventID = e.EventID
            WHERE ej.JudgeID = ?
            ORDER BY e.Date DESC
        `, [req.params.id]);

        res.json({
            ...judge,
            events
        });
    } catch (error) {
        console.error('Error fetching judge:', error);
        res.status(500).json({
            error: 'Failed to fetch judge details'
        });
    }
});

// PUT /judges/:id - Update judge
router.put('/:id', isAuthenticated, hasPrivilege('judges.update'), async (req, res) => {
    try {
        const { specialization, status } = req.body;

        await executeQuery(`
            UPDATE Judges
            SET Specialization = ?,
                Status = ?,
                UpdatedAt = CURRENT_TIMESTAMP
            WHERE JudgeID = ?
        `, [specialization, status, req.params.id]);

        res.json({
            message: 'Judge updated successfully'
        });
    } catch (error) {
        console.error('Error updating judge:', error);
        res.status(500).json({
            error: 'Failed to update judge'
        });
    }
});

// DELETE /judges/:id - Delete judge
router.delete('/:id', isAuthenticated, hasPrivilege('judges.delete'), async (req, res) => {
    try {
        // Check if judge has any event assignments
        const [{ count }] = await executeQuery(
            'SELECT COUNT(*) as count FROM EventJudges WHERE JudgeID = ?',
            [req.params.id]
        );

        if (count > 0) {
            return res.status(400).json({
                error: 'Cannot delete judge with event assignments'
            });
        }

        await executeQuery('DELETE FROM Judges WHERE JudgeID = ?', [req.params.id]);

        res.json({
            message: 'Judge deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting judge:', error);
        res.status(500).json({
            error: 'Failed to delete judge'
        });
    }
});

// POST /judges/:id/events/:eventId - Assign judge to event
router.post('/:id/events/:eventId', isAuthenticated, hasPrivilege('judges.assign'), async (req, res) => {
    try {
        const { id: judgeId, eventId } = req.params;

        // Check if judge is already assigned to this event
        const existingAssignment = await executeQuery(
            'SELECT * FROM EventJudges WHERE JudgeID = ? AND EventID = ?',
            [judgeId, eventId]
        );

        if (existingAssignment.length > 0) {
            return res.status(400).json({
                error: 'Judge is already assigned to this event'
            });
        }

        // Create assignment
        await executeQuery(`
            INSERT INTO EventJudges (JudgeID, EventID, Status, AssignedAt)
            VALUES (?, ?, 'assigned', CURRENT_TIMESTAMP)
        `, [judgeId, eventId]);

        res.status(201).json({
            message: 'Judge assigned successfully'
        });
    } catch (error) {
        console.error('Error assigning judge:', error);
        res.status(500).json({
            error: 'Failed to assign judge'
        });
    }
});

// DELETE /judges/:id/events/:eventId - Remove judge from event
router.delete('/:id/events/:eventId', isAuthenticated, hasPrivilege('judges.assign'), async (req, res) => {
    try {
        const { id: judgeId, eventId } = req.params;

        await executeQuery(
            'DELETE FROM EventJudges WHERE JudgeID = ? AND EventID = ?',
            [judgeId, eventId]
        );

        res.json({
            message: 'Judge removed from event successfully'
        });
    } catch (error) {
        console.error('Error removing judge from event:', error);
        res.status(500).json({
            error: 'Failed to remove judge from event'
        });
    }
});

// GET /judges/available-for-event/:eventId - Get judges not assigned to this event
router.get('/available-for-event/:eventId', isAuthenticated, hasPrivilege('judges.assign'), async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const judges = await executeQuery(`
            SELECT j.JudgeID, u.Name, j.Specialization
            FROM Judges j
            JOIN Users u ON j.UserID = u.UserID
            WHERE j.JudgeID NOT IN (
                SELECT JudgeID FROM EventJudges WHERE EventID = ? AND Status = 'assigned'
            )
            AND j.Status = 'active'
            ORDER BY u.Name ASC
        `, [eventId]);
        res.json(judges);
    } catch (error) {
        console.error('Error fetching available judges:', error);
        res.status(500).json({ error: 'Failed to fetch available judges' });
    }
});

// POST /judges/assign-to-event - Assign judge to event (for HTML forms)
router.post('/assign-to-event', isAuthenticated, hasPrivilege('judges.assign'), async (req, res) => {
    try {
        const { judgeId, eventId } = req.body;
        // Check if judge is already assigned to this event
        const existingAssignment = await executeQuery(
            'SELECT * FROM EventJudges WHERE JudgeID = ? AND EventID = ?',
            [judgeId, eventId]
        );
        if (existingAssignment.length > 0) {
            return res.status(400).render('error', { message: 'Judge is already assigned to this event' });
        }
        // Create assignment
        await executeQuery(
            'INSERT INTO EventJudges (JudgeID, EventID, Status, AssignedAt) VALUES (?, ?, "assigned", CURRENT_TIMESTAMP)',
            [judgeId, eventId]
        );
        res.redirect(`/events/${eventId}`);
    } catch (error) {
        console.error('Error assigning judge:', error);
        res.status(500).render('error', { message: 'Failed to assign judge', error });
    }
});

module.exports = router; 
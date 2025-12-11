const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { isAuthenticated, isJudge } = require('../middleware/auth');

// GET /scores/event/:eventId - Get all scores for an event
router.get('/event/:eventId', isAuthenticated, async (req, res) => {
    try {
        const scores = await executeQuery(`
            SELECT 
                s.ScoreID,
                s.Value,
                s.Criteria,
                s.EventID,
                s.ParticipantUserID,
                s.JudgeID,
                s.CreatedAt,
                u.Name as ParticipantName,
                j.Specialization as JudgeSpecialization,
                ju.Name as JudgeName
            FROM Scores s
            JOIN Users u ON s.ParticipantUserID = u.UserID
            JOIN Judges j ON s.JudgeID = j.JudgeID
            JOIN Users ju ON j.UserID = ju.UserID
            WHERE s.EventID = ?
            ORDER BY s.CreatedAt DESC
        `, [req.params.eventId]);

        res.json(scores);
    } catch (error) {
        console.error('Error fetching scores:', error);
        res.status(500).json({ error: 'Failed to fetch scores' });
    }
});

// GET /scores/participant/:participantId - Get scores for a participant
router.get('/participant/:participantId', isAuthenticated, async (req, res) => {
    try {
        const scores = await executeQuery(`
            SELECT 
                s.ScoreID,
                s.Value,
                s.Criteria,
                s.EventID,
                s.CreatedAt,
                e.Name as EventName,
                j.Specialization as JudgeSpecialization,
                ju.Name as JudgeName
            FROM Scores s
            JOIN Events e ON s.EventID = e.EventID
            JOIN Judges j ON s.JudgeID = j.JudgeID
            JOIN Users ju ON j.UserID = ju.UserID
            WHERE s.ParticipantUserID = ?
            ORDER BY s.EventID, s.Criteria
        `, [req.params.participantId]);

        res.json(scores);
    } catch (error) {
        console.error('Error fetching participant scores:', error);
        res.status(500).json({ error: 'Failed to fetch scores' });
    }
});

// POST /scores - Submit a new score
router.post('/', isJudge, async (req, res) => {
    try {
        const { eventId, participantUserId, value, criteria } = req.body;

        // Validate required fields
        if (!eventId || !participantUserId || value === undefined || !criteria) {
            return res.status(400).json({
                error: 'Missing required fields',
                details: 'Event ID, participant ID, value, and criteria are required'
            });
        }

        // Validate score value
        if (value < 0) {
            return res.status(400).json({
                error: 'Invalid score value',
                details: 'Score value must be non-negative'
            });
        }

        // Get judge ID for the current user
        const [judge] = await executeQuery(
            'SELECT JudgeID FROM Judges WHERE UserID = ?',
            [req.user.id]
        );

        if (!judge) {
            return res.status(403).json({
                error: 'Not authorized',
                details: 'User is not a judge'
            });
        }

        // Check if judge is assigned to this event
        const [assignment] = await executeQuery(`
            SELECT * FROM EventJudges 
            WHERE EventID = ? AND JudgeID = ? AND Status = 'assigned'
        `, [eventId, judge.JudgeID]);

        if (!assignment) {
            return res.status(403).json({
                error: 'Not authorized',
                details: 'Judge is not assigned to this event'
            });
        }

        // Check if participant is registered for the event
        const [registration] = await executeQuery(`
            SELECT * FROM Registrations 
            WHERE EventID = ? AND UserID = ?
        `, [eventId, participantUserId]);

        if (!registration) {
            return res.status(400).json({
                error: 'Invalid participant',
                details: 'Participant is not registered for this event'
            });
        }

        // Insert the score
        const result = await executeQuery(`
            INSERT INTO Scores (
                Value,
                Criteria,
                EventID,
                ParticipantUserID,
                JudgeID,
                CreatedAt
            ) VALUES (?, ?, ?, ?, ?, NOW())
        `, [value, criteria, eventId, participantUserId, judge.JudgeID]);

        res.status(201).json({
            message: 'Score submitted successfully',
            scoreId: result.insertId
        });
    } catch (error) {
        console.error('Error submitting score:', error);
        res.status(500).json({
            error: 'Failed to submit score',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// PUT /scores/:id - Update a score
router.put('/:id', isJudge, async (req, res) => {
    try {
        const { value, criteria } = req.body;
        const scoreId = req.params.id;

        // Get judge ID for the current user
        const [judge] = await executeQuery(
            'SELECT JudgeID FROM Judges WHERE UserID = ?',
            [req.user.id]
        );

        if (!judge) {
            return res.status(403).json({
                error: 'Not authorized',
                details: 'User is not a judge'
            });
        }

        // Check if score exists and belongs to this judge
        const [score] = await executeQuery(`
            SELECT * FROM Scores 
            WHERE ScoreID = ? AND JudgeID = ?
        `, [scoreId, judge.JudgeID]);

        if (!score) {
            return res.status(404).json({
                error: 'Score not found',
                details: 'Score does not exist or does not belong to this judge'
            });
        }

        // Update the score
        await executeQuery(`
            UPDATE Scores 
            SET Value = ?, 
                Criteria = ?,
                UpdatedAt = NOW()
            WHERE ScoreID = ?
        `, [value, criteria, scoreId]);

        res.json({
            message: 'Score updated successfully'
        });
    } catch (error) {
        console.error('Error updating score:', error);
        res.status(500).json({
            error: 'Failed to update score',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// DELETE /scores/:scoreId - Delete a score
router.delete('/:scoreId', isJudge, async (req, res) => {
    try {
        // Check if score exists and belongs to this judge
        const [score] = await executeQuery(`
            SELECT ScoreID 
            FROM Scores 
            WHERE ScoreID = ? AND JudgeID = ?
        `, [req.params.scoreId, req.user.judgeId]);

        if (!score) {
            return res.status(404).json({ error: 'Score not found or unauthorized' });
        }

        // Delete score
        await executeQuery('DELETE FROM Scores WHERE ScoreID = ?', [req.params.scoreId]);

        res.json({ message: 'Score deleted successfully' });
    } catch (error) {
        console.error('Error deleting score:', error);
        res.status(500).json({ error: 'Failed to delete score' });
    }
});

module.exports = router; 
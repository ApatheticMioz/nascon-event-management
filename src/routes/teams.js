const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { isAuthenticated } = require('../middleware/auth');

// GET /teams - Get all teams
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const teams = await executeQuery(`
            SELECT 
                t.*,
                e.Name as EventName,
                u.Name as LeaderName,
                COUNT(tm.UserID) as MemberCount
            FROM Teams t
            JOIN Events e ON t.EventID = e.EventID
            JOIN Users u ON t.LeaderID = u.UserID
            LEFT JOIN TeamMembers tm ON t.TeamID = tm.TeamID
            GROUP BY t.TeamID
            ORDER BY t.CreatedAt DESC
        `);

        res.render('teams', {
            title: 'Teams',
            teams: teams,
            user: req.user
        });
    } catch (error) {
        console.error('Error fetching teams:', error);
        res.status(500).render('error', {
            message: 'Error loading teams',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// GET /teams/:id - Get team details
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        // Get team details
        const [team] = await executeQuery(`
            SELECT 
                t.*,
                e.Name as EventName,
                u.Name as LeaderName,
                u.Email as LeaderEmail
            FROM Teams t
            JOIN Events e ON t.EventID = e.EventID
            JOIN Users u ON t.LeaderID = u.UserID
            WHERE t.TeamID = ?
        `, [req.params.id]);

        if (!team) {
            return res.status(404).render('error', {
                message: 'Team not found'
            });
        }

        // Get team members
        const members = await executeQuery(`
            SELECT 
                u.UserID,
                u.Name,
                u.Email,
                tm.Role,
                tm.Status,
                tm.JoinedAt
            FROM TeamMembers tm
            JOIN Users u ON tm.UserID = u.UserID
            WHERE tm.TeamID = ?
            ORDER BY tm.Role DESC, u.Name ASC
        `, [req.params.id]);

        res.render('team-details', {
            title: team.TeamName,
            team: team,
            members: members,
            user: req.user
        });
    } catch (error) {
        console.error('Error fetching team details:', error);
        res.status(500).render('error', {
            message: 'Error loading team details',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// POST /teams - Create new team
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { teamName, eventId } = req.body;

        // Validate required fields
        if (!teamName || !eventId) {
            return res.status(400).json({
                error: 'Missing required fields'
            });
        }

        // Check if team name is already taken for this event
        const existingTeams = await executeQuery(
            'SELECT TeamID FROM Teams WHERE TeamName = ? AND EventID = ?',
            [teamName, eventId]
        );

        if (existingTeams.length > 0) {
            return res.status(400).json({
                error: 'Team name already exists for this event'
            });
        }

        // Enforce team size: leader must add at least one more member later (2-3 total)
        // We'll allow creation, but warn if only one member
        // Team member addition will enforce the upper limit

        // Create team
        const result = await executeQuery(`
            INSERT INTO Teams (TeamName, EventID, LeaderID)
            VALUES (?, ?, ?)
        `, [teamName, eventId, req.user.id]);

        // Add leader as team member
        await executeQuery(`
            INSERT INTO TeamMembers (TeamID, UserID, Role)
            VALUES (?, ?, 'Leader')
        `, [result.insertId, req.user.id]);

        res.status(201).json({
            message: 'Team created successfully. Remember: teams must have 2-3 members.',
            teamId: result.insertId
        });
    } catch (error) {
        console.error('Error creating team:', error);
        res.status(500).json({
            error: 'Failed to create team'
        });
    }
});

// POST /teams/:id/members - Add team member
router.post('/:id/members', isAuthenticated, async (req, res) => {
    try {
        const { userId, role = 'Member' } = req.body;

        // Check if user is team leader
        const [team] = await executeQuery(
            'SELECT LeaderID FROM Teams WHERE TeamID = ?',
            [req.params.id]
        );

        if (!team || team.LeaderID !== req.user.id) {
            return res.status(403).json({
                error: 'Only team leader can add members'
            });
        }

        // Check current team size (active members)
        const [{ count }] = await executeQuery(
            'SELECT COUNT(*) as count FROM TeamMembers WHERE TeamID = ? AND Status = "active"',
            [req.params.id]
        );
        if (count >= 3) {
            return res.status(400).json({
                error: 'Team already has maximum allowed members (3)'
            });
        }

        // Check if user is already a member
        const existingMembers = await executeQuery(
            'SELECT UserID FROM TeamMembers WHERE TeamID = ? AND UserID = ?',
            [req.params.id, userId]
        );

        if (existingMembers.length > 0) {
            return res.status(400).json({
                error: 'User is already a team member'
            });
        }

        // Add member
        await executeQuery(`
            INSERT INTO TeamMembers (TeamID, UserID, Role)
            VALUES (?, ?, ?)
        `, [req.params.id, userId, role]);

        res.status(201).json({
            message: 'Member added successfully'
        });
    } catch (error) {
        console.error('Error adding team member:', error);
        res.status(500).json({
            error: 'Failed to add team member'
        });
    }
});

// PUT /teams/:id/members/:userId - Update member status
router.put('/:id/members/:userId', isAuthenticated, async (req, res) => {
    try {
        const { status } = req.body;

        // Check if user is team leader
        const [team] = await executeQuery(
            'SELECT LeaderID FROM Teams WHERE TeamID = ?',
            [req.params.id]
        );

        if (!team || team.LeaderID !== req.user.id) {
            return res.status(403).json({
                error: 'Only team leader can update member status'
            });
        }

        // Update member status
        await executeQuery(`
            UPDATE TeamMembers
            SET Status = ?
            WHERE TeamID = ? AND UserID = ?
        `, [status, req.params.id, req.params.userId]);

        res.json({
            message: 'Member status updated successfully'
        });
    } catch (error) {
        console.error('Error updating member status:', error);
        res.status(500).json({
            error: 'Failed to update member status'
        });
    }
});

// DELETE /teams/:id/members/:userId - Remove team member
router.delete('/:id/members/:userId', isAuthenticated, async (req, res) => {
    try {
        // Check if user is team leader or the member being removed
        const [team] = await executeQuery(
            'SELECT LeaderID FROM Teams WHERE TeamID = ?',
            [req.params.id]
        );

        if (!team || (team.LeaderID !== req.user.id && req.params.userId !== req.user.id)) {
            return res.status(403).json({
                error: 'Unauthorized to remove team member'
            });
        }

        // Remove member
        await executeQuery(`
            DELETE FROM TeamMembers
            WHERE TeamID = ? AND UserID = ?
        `, [req.params.id, req.params.userId]);

        res.json({
            message: 'Member removed successfully'
        });
    } catch (error) {
        console.error('Error removing team member:', error);
        res.status(500).json({
            error: 'Failed to remove team member'
        });
    }
});

module.exports = router; 
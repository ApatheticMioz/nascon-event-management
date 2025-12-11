const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');

// GET /competitions - render competitions page
router.get('/', async (req, res) => {
    try {
        // Fetch event categories
        const categoriesQuery = 'SELECT * FROM EventCategories';
        const categories = await executeQuery(categoriesQuery);

        // Fetch competitions with category information
        const competitionsQuery = `
            SELECT e.*, ec.CategoryName, ec.Description as CategoryDescription
            FROM Events e
            JOIN EventCategories ec ON e.CategoryID = ec.CategoryID
            WHERE e.Status = 'Published'
            ORDER BY e.Date DESC
        `;
        const competitions = await executeQuery(competitionsQuery);

        res.render('competitions', {
            title: 'Competitions',
            categories: categories,
            competitions: competitions,
            user: req.user
        });
    } catch (error) {
        console.error('Error fetching competitions:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Error loading competitions',
            error: process.env.NODE_ENV === 'development' ? error : {},
            user: req.user
        });
    }
});

// GET /api/events/competitions - get all competitions
router.get('/api/competitions', async (req, res) => {
    try {
        const { category } = req.query;
        let query = `
            SELECT e.*, ec.CategoryName, ec.Description as CategoryDescription
            FROM Events e
            JOIN EventCategories ec ON e.CategoryID = ec.CategoryID
            WHERE e.Status = 'Published'
        `;

        const params = [];
        if (category) {
            query += ' AND ec.CategoryName = ?';
            params.push(category);
        }

        query += ' ORDER BY e.Date DESC';
        const competitions = await executeQuery(query, params);
        res.json(competitions);
    } catch (error) {
        console.error('Error fetching competitions:', error);
        res.status(500).json({ 
            error: 'Failed to fetch competitions',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// GET /api/events/categories - get all competition categories
router.get('/api/categories', async (req, res) => {
    try {
        const categories = await executeQuery('SELECT * FROM EventCategories');
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ 
            error: 'Failed to fetch categories',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// POST /competitions/api/register - Register for a competition
router.post('/api/register', async (req, res) => {
    try {
        const { eventId, userId, registrationType, teamId } = req.body;

        // Validate required fields
        if (!eventId || !userId || !registrationType) {
            return res.status(400).json({
                error: 'Missing required fields'
            });
        }

        // Check if event exists and is open for registration
        const eventQuery = `
            SELECT EventID, EventType, Max_Participants, RegistrationDeadline
            FROM Events
            WHERE EventID = ? AND Status = 'Published'
        `;
        const events = await executeQuery(eventQuery, [eventId]);
        
        if (events.length === 0) {
            return res.status(404).json({
                error: 'Event not found or registration is closed'
            });
        }

        const event = events[0];

        // Check registration deadline
        if (new Date(event.RegistrationDeadline) < new Date()) {
            return res.status(400).json({
                error: 'Registration deadline has passed'
            });
        }

        // Check if user is already registered
        const existingRegistrationQuery = `
            SELECT RegistrationID
            FROM EventRegistrations
            WHERE EventID = ? AND UserID = ?
        `;
        const existingRegistrations = await executeQuery(existingRegistrationQuery, [eventId, userId]);
        
        if (existingRegistrations.length > 0) {
            return res.status(400).json({
                error: 'You are already registered for this event'
            });
        }

        // Handle team registration
        if (registrationType === 'Team') {
            if (!teamId) {
                return res.status(400).json({
                    error: 'Team ID is required for team registration'
                });
            }

            // Check if team exists and user is a member
            const teamQuery = `
                SELECT t.TeamID, t.LeaderID, tm.UserID
                FROM Teams t
                LEFT JOIN TeamMembers tm ON t.TeamID = tm.TeamID
                WHERE t.TeamID = ? AND (t.LeaderID = ? OR tm.UserID = ?)
            `;
            const teams = await executeQuery(teamQuery, [teamId, userId, userId]);
            
            if (teams.length === 0) {
                return res.status(403).json({
                    error: 'You are not a member of this team'
                });
            }
        }

        // Insert registration
        const insertQuery = `
            INSERT INTO EventRegistrations (
                EventID, UserID, TeamID, RegistrationType
            ) VALUES (?, ?, ?, ?)
        `;
        await executeQuery(insertQuery, [
            eventId,
            userId,
            registrationType === 'Team' ? teamId : null,
            registrationType
        ]);

        res.status(201).json({
            message: 'Registration successful'
        });
    } catch (error) {
        console.error('Error in competition registration:', error);
        res.status(500).json({
            error: 'Registration failed',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router; 
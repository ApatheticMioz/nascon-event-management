const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');

// GET /schedule - Render schedule page
router.get('/', async (req, res) => {
    try {
        // Fetch all events with venue details
        const query = `
            SELECT 
                e.EventID,
                e.Name as EventName,
                e.Date,
                e.Time,
                e.EventDescription,
                e.Max_Participants,
                e.Reg_Fee,
                v.Name as VenueName,
                v.Location,
                u.Name as OrganizerName
            FROM Events e
            LEFT JOIN Venues v ON e.VenueID = v.VenueID
            LEFT JOIN Users u ON e.OrganizerID = u.UserID
            WHERE e.Date >= CURDATE()
            ORDER BY e.Date ASC, e.Time ASC
        `;

        const events = await executeQuery(query);

        // Group events by date
        const schedule = events.reduce((acc, event) => {
            const date = new Date(event.Date).toLocaleDateString();
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(event);
            return acc;
        }, {});

        res.render('schedule', {
            title: 'Event Schedule',
            schedule: schedule,
            user: req.session.user || null
        });
    } catch (error) {
        console.error('Error fetching schedule:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Error loading schedule. Please try again later.',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// GET /schedule/api/events - Get all events with optional filters
router.get('/api/events', async (req, res) => {
    try {
        const { date, category, search } = req.query;
        let query = `
            SELECT 
                e.EventID,
                e.Name,
                e.Date,
                e.Time,
                e.EventDescription,
                e.Max_Participants,
                e.Reg_Fee,
                v.Name as VenueName,
                v.Location as VenueLocation,
                u.Name as OrganizerName
            FROM Events e
            LEFT JOIN Venues v ON e.VenueID = v.VenueID
            LEFT JOIN Users u ON e.OrganizerID = u.UserID
            WHERE 1=1
        `;
        
        const params = [];
        
        if (date) {
            query += ` AND DATE(e.Date) = ?`;
            params.push(date);
        }
        
        if (category) {
            query += ` AND e.Category = ?`;
            params.push(category);
        }
        
        if (search) {
            query += ` AND (e.Name LIKE ? OR e.EventDescription LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }
        
        query += ` ORDER BY e.Date ASC, e.Time ASC`;

        const events = await executeQuery(query, params);
        
        // Group events by date
        const eventsByDate = events.reduce((acc, event) => {
            const date = new Date(event.Date).toLocaleDateString();
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(event);
            return acc;
        }, {});

        // Get unique categories
        const categories = [...new Set(events.map(event => event.Category))];

        res.json({
            eventsByDate,
            categories
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({
            error: 'Failed to fetch events',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router; 
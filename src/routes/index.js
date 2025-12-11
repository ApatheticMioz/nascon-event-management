const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');

// GET / - Home page
router.get('/', async (req, res) => {
    try {
        // Fetch upcoming events with venue details
        const query = `
            SELECT 
                e.EventID,
                e.Name as EventName,
                e.Date,
                e.Time,
                e.EventDescription,
                v.Name as VenueName,
                v.Location
            FROM Events e
            LEFT JOIN Venues v ON e.VenueID = v.VenueID
            WHERE e.Date >= CURDATE()
            ORDER BY e.Date, e.Time
            LIMIT 9
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

        res.render('index', {
            title: 'NASCON - National Software Competition',
            schedule: schedule,
            user: req.user || null
        });
    } catch (error) {
        console.error('Error fetching home page data:', error);
        res.render('index', {
            title: 'NASCON - National Software Competition',
            schedule: {},
            user: req.user || null
        });
    }
});

module.exports = router; 
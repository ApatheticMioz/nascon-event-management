const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');

// GET /workshops - Render workshops page
router.get('/', (req, res) => {
    res.render('workshops', {
        title: 'NASCON Workshops & Guest Speakers',
        user: req.session.user || null
    });
});

// GET /workshops/api/workshops - Get all workshops
router.get('/api/workshops', async (req, res) => {
    try {
        const query = `
            SELECT 
                WorkshopID, 
                Title, 
                Description, 
                Instructor, 
                Date, 
                Time, 
                Venue, 
                Capacity 
            FROM Workshops 
            ORDER BY Date, Time
        `;

        const workshops = await executeQuery(query);
        
        // Add sample data if no workshops are found
        if (workshops.length === 0) {
            workshops.push({
                WorkshopID: 1,
                Title: "Introduction to Web Development",
                Description: "Learn the basics of HTML, CSS, and JavaScript",
                Instructor: "Dr. John Smith",
                Date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                Time: "10:00 AM",
                Venue: "Main Auditorium",
                Capacity: 50
            });
        }
        
        res.json(workshops);
    } catch (error) {
        console.error('Error fetching workshops:', error);
        res.status(500).json({ 
            error: 'Failed to fetch workshops',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// GET /workshops/api/speakers - Get all guest speakers
router.get('/api/speakers', async (req, res) => {
    try {
        const query = `
            SELECT 
                SpeakerID, 
                Name, 
                PhotoURL, 
                Bio, 
                Topic, 
                SessionDate, 
                SessionTime, 
                SessionVenue 
            FROM Speakers 
            ORDER BY SessionDate, SessionTime
        `;

        const speakers = await executeQuery(query);
        
        // Add sample data if no speakers are found
        if (speakers.length === 0) {
            speakers.push({
                SpeakerID: 1,
                Name: "Dr. Sarah Johnson",
                PhotoURL: "/images/speakers/sample-speaker.jpg",
                Bio: "Dr. Sarah Johnson is a renowned expert in Artificial Intelligence with over 15 years of experience.",
                Topic: "The Future of AI in Education",
                SessionDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
                SessionTime: "2:00 PM",
                SessionVenue: "Conference Hall"
            });
        }
        
        res.json(speakers);
    } catch (error) {
        console.error('Error fetching speakers:', error);
        res.status(500).json({ 
            error: 'Failed to fetch speakers',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router; 
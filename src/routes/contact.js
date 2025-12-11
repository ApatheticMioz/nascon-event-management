const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');

// GET /contact - Render contact page
router.get('/', (req, res) => {
    res.render('contact', {
        title: 'Contact & Support',
        user: req.session.user || null
    });
});

// POST /contact/api/inquiries - Handle contact form submissions
router.post('/api/inquiries', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Validate required fields
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                error: 'Missing required fields',
                details: 'Name, email, subject, and message are required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Invalid email format',
                details: 'Please provide a valid email address'
            });
        }

        // Insert inquiry into database
        const query = `
            INSERT INTO ContactInquiries (Name, Email, Subject, Message, Status)
            VALUES (?, ?, ?, ?, 'Pending')
        `;
        
        await executeQuery(query, [name, email, subject, message]);

        res.status(201).json({
            message: 'Your message has been sent successfully. We will get back to you soon.'
        });
    } catch (error) {
        console.error('Error in contact form submission:', error);
        res.status(500).json({
            error: 'Failed to submit contact form',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router; 
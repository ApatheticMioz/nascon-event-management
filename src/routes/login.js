const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { executeQuery } = require('../config/database');
const { setNotification } = require('../middleware/notification');
const passport = require('passport');

// GET /login - Render login page
router.get('/', (req, res) => {
    // Show success message if user just registered
    if (req.query.registered === 'true') {
        setNotification(req, 'Registration successful! Please log in.', 'success');
    }
    
    res.render('login', {
        title: 'Login',
        user: req.user,
        url: req.originalUrl
    });
});

// POST /login - Handle login
router.post('/', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            console.error('Login error:', err);
            return res.status(500).json({ error: 'Login failed', details: err.message });
        }
        if (!user) {
            return res.status(401).json({ error: 'Login failed', details: info && info.message ? info.message : 'Invalid email or password' });
        }
        req.logIn(user, (err) => {
            if (err) {
                console.error('Login error:', err);
                return res.status(500).json({ error: 'Login failed', details: err.message });
            }
            // Optionally set a notification here
            return res.json({
                message: 'Login successful',
                user: {
                    id: user.UserID,
                    name: user.Name,
                    email: user.Email,
                    role: user.Role,
                    username: user.username
                },
                redirect: '/'
            });
        });
    })(req, res, next);
});

module.exports = router; 
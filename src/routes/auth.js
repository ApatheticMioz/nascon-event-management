const express = require('express');
const passport = require('passport');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { isAuthenticated, hasPrivilege, isAdmin } = require('../middleware/auth');

// Logout route
router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.redirect('/');
        }
        res.redirect('/');
    });
});

// Get current user
router.get('/current-user', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({
            id: req.user.UserID,
            name: req.user.Name,
            email: req.user.Email,
            role: req.user.Role,
            username: req.user.username
        });
    } else {
        res.status(401).json({ message: 'Not authenticated' });
    }
});

// Check if user is admin
router.get('/is-admin', (req, res) => {
    if (req.isAuthenticated() && req.user.Role === 'admin') {
        res.json({ isAdmin: true });
    } else {
        res.json({ isAdmin: false });
    }
});

// Get user details by email
router.get('/users/:email', isAuthenticated, hasPrivilege('users', 'read'), async (req, res) => {
    try {
        const query = `
            SELECT u.UserID, u.Name, u.Email, u.Contact, u.username, r.RoleName as Role
            FROM Users u
            JOIN Roles r ON u.RoleID = r.RoleID
            WHERE u.Email = ?
        `;
        const users = await executeQuery(query, [req.params.email]);
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(users[0]);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all users (admin only)
router.get('/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const query = `
            SELECT u.UserID, u.Name, u.Email, u.Contact, u.username, r.RoleName as Role
            FROM Users u
            JOIN Roles r ON u.RoleID = r.RoleID
            ORDER BY u.UserID DESC
        `;
        const users = await executeQuery(query);
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 
const express = require('express');
const router = express.Router();

// Registration Process FAQ
router.get('/registration', (req, res) => {
    res.render('faq/registration', {
        title: 'Registration Process FAQ',
        user: req.session.user || null
    });
});

// Registration Fees FAQ
router.get('/fees', (req, res) => {
    res.render('faq/fees', {
        title: 'Registration Fees FAQ',
        user: req.session.user || null
    });
});

// Refund Policy FAQ
router.get('/refund', (req, res) => {
    res.render('faq/refund', {
        title: 'Refund Policy FAQ',
        user: req.session.user || null
    });
});

module.exports = router; 
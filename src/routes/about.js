const express = require('express');
const router = express.Router();

// GET /about
router.get('/', (req, res) => {
    res.render('about', {
        title: 'About NASCON',
        user: req.session.user || null
    });
});

module.exports = router; 
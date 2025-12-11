const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { isAuthenticated, hasPrivilege } = require('../middleware/auth');
const { venueValidation } = require('../middleware/venueValidation');

// GET /venues - Render venues page
router.get('/', async (req, res) => {
    try {
        // Fetch venues from database
        const venuesQuery = `
            SELECT 
                v.*,
                COUNT(DISTINCT e.EventID) as EventCount
            FROM Venues v
            LEFT JOIN Events e ON v.VenueID = e.VenueID
            GROUP BY v.VenueID
            ORDER BY v.Name ASC
        `;
        const venues = await executeQuery(venuesQuery);

        res.render('venues', {
            title: 'NASCON Venues',
            venues: venues,
            user: req.session.user || null
        });
    } catch (error) {
        console.error('Error fetching venues:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Error loading venues',
            error: process.env.NODE_ENV === 'development' ? error : {},
            user: req.session.user || null
        });
    }
});

// GET /venues/api/venues - Get all venues
router.get('/api/venues', async (req, res) => {
    try {
        const { type, capacity, availability } = req.query;
        let query = `
            SELECT 
                v.*,
                COUNT(DISTINCT e.EventID) as EventCount
            FROM Venues v
            LEFT JOIN Events e ON v.VenueID = e.VenueID
            WHERE 1=1
        `;
        
        const params = [];
        
        if (type) {
            query += ` AND v.VenueType = ?`;
            params.push(type);
        }
        
        if (capacity) {
            query += ` AND v.Capacity >= ?`;
            params.push(capacity);
        }
        
        if (availability) {
            query += ` AND v.Status = ?`;
            params.push(availability);
        }
        
        query += ` GROUP BY v.VenueID ORDER BY v.Name ASC`;
        
        const venues = await executeQuery(query, params);
        res.json(venues);
    } catch (error) {
        console.error('Error fetching venues:', error);
        res.status(500).json({ 
            error: 'Failed to fetch venues',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// GET /venues/:id - Get single venue
router.get('/:id', async (req, res) => {
    try {
        const venueQuery = `
            SELECT 
                v.*,
                COUNT(DISTINCT e.EventID) as EventCount,
                GROUP_CONCAT(DISTINCT e.Name) as UpcomingEvents
            FROM Venues v
            LEFT JOIN Events e ON v.VenueID = e.VenueID
            WHERE v.VenueID = ?
            GROUP BY v.VenueID
        `;
        const venues = await executeQuery(venueQuery, [req.params.id]);

        if (venues.length === 0) {
            return res.status(404).json({ error: 'Venue not found' });
        }

        res.json(venues[0]);
    } catch (error) {
        console.error('Error fetching venue:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /venues - Create new venue (protected route)
router.post('/', isAuthenticated, hasPrivilege('venues', 'create'), venueValidation, async (req, res) => {
    try {
        const {
            name,
            address,
            location,
            capacity,
            availability,
            facilities,
            mapEmbedURL,
            description,
            contactPerson,
            contactEmail,
            contactPhone,
            venueType,
            status,
            equipment,
            restrictions
        } = req.body;

        const [result] = await executeQuery(`
            INSERT INTO Venues (
                Name, Address, Location, Capacity, Availability,
                Facilities, MapEmbedURL, Description, ContactPerson,
                ContactEmail, ContactPhone, VenueType, Status,
                Equipment, Restrictions
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            name,
            address,
            location,
            capacity,
            availability,
            facilities,
            mapEmbedURL,
            description,
            contactPerson,
            contactEmail,
            contactPhone,
            venueType,
            status || 'Available',
            equipment,
            restrictions
        ]);

        res.status(201).json({
            message: 'Venue created successfully',
            venueId: result.insertId
        });
    } catch (error) {
        console.error('Error creating venue:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /venues/:id - Update venue (protected route)
router.put('/:id', isAuthenticated, hasPrivilege('venues', 'update'), venueValidation, async (req, res) => {
    try {
        const {
            name,
            address,
            location,
            capacity,
            availability,
            facilities,
            mapEmbedURL,
            description,
            contactPerson,
            contactEmail,
            contactPhone,
            venueType,
            status,
            equipment,
            restrictions
        } = req.body;

        const [result] = await executeQuery(`
            UPDATE Venues
            SET Name = ?, Address = ?, Location = ?, Capacity = ?,
                Availability = ?, Facilities = ?, MapEmbedURL = ?,
                Description = ?, ContactPerson = ?, ContactEmail = ?,
                ContactPhone = ?, VenueType = ?, Status = ?,
                Equipment = ?, Restrictions = ?
            WHERE VenueID = ?
        `, [
            name,
            address,
            location,
            capacity,
            availability,
            facilities,
            mapEmbedURL,
            description,
            contactPerson,
            contactEmail,
            contactPhone,
            venueType,
            status,
            equipment,
            restrictions,
            req.params.id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Venue not found' });
        }

        res.json({ message: 'Venue updated successfully' });
    } catch (error) {
        console.error('Error updating venue:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /venues/:id - Delete venue (protected route)
router.delete('/:id', isAuthenticated, hasPrivilege('venues', 'delete'), async (req, res) => {
    try {
        // Check if venue has associated events
        const events = await executeQuery(`
            SELECT COUNT(*) as count
            FROM Events
            WHERE VenueID = ?
        `, [req.params.id]);

        if (events[0].count > 0) {
            return res.status(400).json({
                error: 'Cannot delete venue with associated events'
            });
        }

        const [result] = await executeQuery(`
            DELETE FROM Venues
            WHERE VenueID = ?
        `, [req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Venue not found' });
        }

        res.json({ message: 'Venue deleted successfully' });
    } catch (error) {
        console.error('Error deleting venue:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 
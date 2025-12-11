const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/accommodations')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

// GET /accommodations - render accommodations page
router.get('/', async (req, res) => {
    try {
        // Fetch accommodations from database
        const accommodationsQuery = `
            SELECT 
                AccommodationID,
                Name,
                Location,
                Capacity,
                Availability,
                BudgetRange,
                PhotoURLs,
                Description,
                Amenities,
                ContactInfo
            FROM Accommodations
            WHERE Availability != 'Unavailable'
            ORDER BY Capacity DESC
        `;
        const accommodations = await executeQuery(accommodationsQuery);
        
        // Fetch venues from database
        const venuesQuery = `
            SELECT 
                VenueID,
                Name,
                Address,
                Location,
                Capacity,
                Facilities,
                MapEmbedURL,
                Description,
                ContactPerson,
                ContactEmail,
                ContactPhone,
                VenueType,
                Status,
                Equipment
            FROM Venues
            WHERE Status = 'Available'
            ORDER BY Capacity DESC
        `;
        const venues = await executeQuery(venuesQuery);

        res.render('accommodations', {
            title: 'Accommodations & Venues',
            accommodations: accommodations,
            venues: venues,
            user: req.user
        });
    } catch (error) {
        console.error('Error fetching accommodations:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Error loading accommodations and venues',
            error: process.env.NODE_ENV === 'development' ? error : {},
            user: req.user
        });
    }
});

// POST /api/accommodations/request - Request accommodation
router.post('/api/accommodations/request', async (req, res) => {
    try {
        const { participantId, numberOfPeople, budget, checkIn, checkOut } = req.body;

        // Validate request
        if (!participantId || !numberOfPeople || !budget || !checkIn || !checkOut) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Find suitable accommodation based on criteria
        const findAccommodationQuery = `
            SELECT AccommodationID, Name, Capacity, BudgetRange
            FROM Accommodations
            WHERE Availability = 'Available'
            AND Capacity >= ?
            AND CAST(SUBSTRING_INDEX(BudgetRange, '-', -1) AS DECIMAL) <= ?
            ORDER BY ABS(Capacity - ?) ASC, CAST(SUBSTRING_INDEX(BudgetRange, '-', 1) AS DECIMAL) ASC
            LIMIT 1
        `;
        const accommodations = await executeQuery(findAccommodationQuery, [numberOfPeople, budget, numberOfPeople]);

        if (accommodations.length === 0) {
            return res.status(404).json({ error: 'No suitable accommodation found' });
        }

        const accommodation = accommodations[0];

        // Create accommodation request
        const createRequestQuery = `
            INSERT INTO AccommodationRequests (
                ParticipantID,
                AccommodationID,
                NumberOfPeople,
                Budget,
                CheckInDate,
                CheckOutDate,
                Status
            ) VALUES (?, ?, ?, ?, ?, ?, 'Pending')
        `;
        const result = await executeQuery(createRequestQuery, [
            participantId,
            accommodation.AccommodationID,
            numberOfPeople,
            budget,
            checkIn,
            checkOut
        ]);

        res.status(201).json({
            message: 'Accommodation request created successfully',
            requestId: result.insertId,
            accommodation: accommodation
        });
    } catch (error) {
        console.error('Error creating accommodation request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/accommodations/requests/:participantId - Get participant's requests
router.get('/api/accommodations/requests/:participantId', async (req, res) => {
    try {
        const requests = await executeQuery(`
            SELECT 
                ar.*,
                a.Name as AccommodationName,
                a.Location,
                a.BudgetRange
            FROM AccommodationRequests ar
            JOIN Accommodations a ON ar.AccommodationID = a.AccommodationID
            WHERE ar.ParticipantID = ?
            ORDER BY ar.RequestDate DESC
        `, [req.params.participantId]);
        res.json(requests);
    } catch (error) {
        console.error('Error fetching accommodation requests:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/accommodations/reports/allocation - Generate room allocation report
router.get('/api/accommodations/reports/allocation', async (req, res) => {
    try {
        const report = await executeQuery(`
            SELECT 
                a.Name as AccommodationName,
                a.Location,
                a.Capacity,
                COUNT(ar.RequestID) as TotalRequests,
                SUM(ar.NumberOfPeople) as TotalPeopleAllocated,
                a.Capacity - SUM(COALESCE(ar.NumberOfPeople, 0)) as RemainingCapacity,
                GROUP_CONCAT(DISTINCT 
                    CASE 
                        WHEN ar.Status = 'Approved' 
                        THEN CONCAT(p.Name, ' (', ar.NumberOfPeople, ' people)')
                        END
                    SEPARATOR ', ') as AllocatedParticipants
            FROM Accommodations a
            LEFT JOIN AccommodationRequests ar ON a.AccommodationID = ar.AccommodationID
            LEFT JOIN Participants p ON ar.ParticipantID = p.ParticipantID
            GROUP BY a.AccommodationID
            ORDER BY a.Name ASC
        `);
        res.json(report);
    } catch (error) {
        console.error('Error generating allocation report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /accommodations/add - Show accommodation form
router.get('/add', (req, res) => {
    res.render('accommodation-form', {
        title: 'Add New Accommodation',
        user: req.session.user || null
    });
});

// POST /accommodations/add - Handle accommodation form submission
router.post('/add', upload.array('photos', 5), async (req, res) => {
    try {
        console.log('Form submission received:', req.body);
        console.log('Files received:', req.files);

        const {
            name,
            location,
            capacity,
            availability,
            budgetRange,
            description,
            contactInfo
        } = req.body;

        // Get amenities as a comma-separated string
        let amenities = '';
        if (Array.isArray(req.body.amenities)) {
            amenities = req.body.amenities.join(', ');
        } else if (typeof req.body.amenities === 'string') {
            amenities = req.body.amenities;
        }

        // Get photo URLs
        const photoURLs = req.files ? req.files.map(file => `/uploads/accommodations/${file.filename}`).join(',') : '';

        console.log('Processed data:', {
            name,
            location,
            capacity,
            availability,
            budgetRange,
            description,
            contactInfo,
            amenities,
            photoURLs
        });

        // Insert into database
        const query = `
            INSERT INTO Accommodations (
                Name, Location, Capacity, Availability,
                BudgetRange, PhotoURLs, Description,
                Amenities, ContactInfo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const result = await executeQuery(query, [
            name,
            location,
            capacity,
            availability,
            budgetRange,
            photoURLs,
            description,
            amenities,
            contactInfo
        ]);

        console.log('Database insertion successful:', result);

        return res.render('success', {
            title: 'Accommodation Added',
            message: 'Accommodation added successfully!',
            backUrl: '/accommodations',
            user: req.session.user || null
        });
    } catch (error) {
        console.error('Error adding accommodation:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Error adding accommodation',
            error: process.env.NODE_ENV === 'development' ? error : {},
            user: req.session.user || null
        });
    }
});

module.exports = router;
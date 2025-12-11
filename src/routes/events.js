const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { isAuthenticated, hasPrivilege, requireRole } = require('../middleware/auth');
const { eventValidation } = require('../middleware/validation');

// Helper function to get event icon based on category
function getEventIcon(category) {
    const icons = {
        'Competition': 'fas fa-trophy',
        'Workshop': 'fas fa-chalkboard-teacher',
        'Seminar': 'fas fa-microphone',
        'Cultural': 'fas fa-theater-masks',
        'Sports': 'fas fa-running',
        'Technical': 'fas fa-laptop-code',
        'default': 'fas fa-calendar-alt'
    };
    return icons[category] || icons.default;
}

// GET /events - Get all events
router.get('/', async (req, res) => {
    try {
        const events = await executeQuery(`
            SELECT 
                e.EventID,
                e.Name,
                DATE_FORMAT(e.Date, '%Y-%m-%d') as Date,
                e.Time,
                e.EventDescription,
                e.EventType,
                e.Status,
                e.Reg_Fee,
                e.Max_Participants,
                e.Rules,
                e.RegistrationDeadline,
                v.Name as VenueName,
                v.Location as VenueLocation,
                c.CategoryName,
                u.Name as OrganizerName,
                COUNT(DISTINCT r.UserID) as RegisteredParticipants
            FROM Events e
            LEFT JOIN Venues v ON e.VenueID = v.VenueID
            LEFT JOIN EventCategories c ON e.CategoryID = c.CategoryID
            LEFT JOIN Users u ON e.OrganizerID = u.UserID
            LEFT JOIN Registrations r ON e.EventID = r.EventID
            GROUP BY e.EventID
            ORDER BY e.Date ASC, e.Time ASC
        `);

        res.render('events', {
            title: 'NASCON Events',
            events,
            getEventIcon,
            user: req.user
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).render('error', {
            message: 'Error fetching events',
            error
        });
    }
});

// GET /events/add - Show event creation form
router.get('/add', isAuthenticated, hasPrivilege('Events.create'), async (req, res) => {
    try {
        const [categories, venues] = await Promise.all([
            executeQuery('SELECT * FROM EventCategories ORDER BY CategoryName'),
            executeQuery('SELECT * FROM Venues ORDER BY Name')
        ]);

        res.render('event-form', {
            title: 'Create Event',
            event: null,
            categories,
            venues,
            user: req.user
        });
    } catch (error) {
        console.error('Error loading event form:', error);
        res.status(500).render('error', {
            message: 'Error loading event form',
            error
        });
    }
});

// POST /events/add - Create new event
router.post('/add', isAuthenticated, hasPrivilege('Events.create'), eventValidation, async (req, res) => {
    try {
        const {
            name, categoryId, eventType, status, eventDescription,
            date, time, registrationDeadline, venueId, maxParticipants,
            regFee
        } = req.body;

        const result = await executeQuery(`
            INSERT INTO Events (
                Name, CategoryID, EventType, Status, EventDescription,
                Date, Time, RegistrationDeadline, VenueID, Max_Participants,
                Reg_Fee, OrganizerID
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            name, categoryId, eventType, status, eventDescription,
            date, time, registrationDeadline, venueId, maxParticipants,
            regFee, req.user.UserID
        ]);

        res.json({
            success: true,
            eventId: result.insertId,
            message: 'Event created successfully'
        });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({
            success: false,
            error: 'Error creating event'
        });
    }
});

// GET /events/:id - Get event details
router.get('/:id', async (req, res) => {
    try {
        // Fetch event with joins for category and organizer names
        const [event] = await executeQuery(`
            SELECT 
                e.*,
                v.Name as VenueName,
                v.Location as VenueLocation,
                v.Capacity as VenueCapacity,
                c.CategoryName,
                u.Name as OrganizerName
            FROM Events e
            LEFT JOIN Venues v ON e.VenueID = v.VenueID
            LEFT JOIN EventCategories c ON e.CategoryID = c.CategoryID
            LEFT JOIN Users u ON e.OrganizerID = u.UserID
            WHERE e.EventID = ?
        `, [req.params.id]);

        if (!event) {
            return res.status(404).render('error', {
                message: 'Event not found',
                error: { status: 404 }
            });
        }

        // Get assigned judges
        const judges = await executeQuery(`
            SELECT 
                j.JudgeID,
                j.Specialization,
                u.Name,
                ej.AssignedAt
            FROM EventJudges ej
            JOIN Judges j ON ej.JudgeID = j.JudgeID
            JOIN Users u ON j.UserID = u.UserID
            WHERE ej.EventID = ? AND ej.Status = 'assigned'
            ORDER BY ej.AssignedAt DESC
        `, [req.params.id]);

        // Get rankings
        const rankings = await executeQuery(`
            SELECT 
                u.UserID as ParticipantUserID,
                u.Name as ParticipantName,
                COUNT(DISTINCT s.JudgeID) as JudgeCount,
                SUM(s.Value) as TotalScore,
                AVG(s.Value) as AverageScore
            FROM Users u
            JOIN Registrations r ON u.UserID = r.UserID
            LEFT JOIN Scores s ON r.RegistrationID = s.RegistrationID
            WHERE r.EventID = ?
            GROUP BY u.UserID
            ORDER BY TotalScore DESC, AverageScore DESC
        `, [req.params.id]);

        // Get participants
        const participants = await executeQuery(`
            SELECT 
                u.Name, u.Email, r.RegistrationDate, t.TeamName, r.PaymentStatus
            FROM Registrations r
            JOIN Users u ON r.UserID = u.UserID
            LEFT JOIN Teams t ON r.TeamID = t.TeamID
            WHERE r.EventID = ?
            ORDER BY r.RegistrationDate ASC
        `, [req.params.id]);

        res.render('event-details', {
            title: event.Name,
            event,
            judges,
            rankings,
            participants,
            user: req.user
        });
    } catch (error) {
        console.error('Error fetching event details:', error);
        res.status(500).render('error', {
            message: 'Error loading event details',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// GET /events/edit/:id - Show event edit form
router.get('/edit/:id', isAuthenticated, async (req, res) => {
    try {
        const [event] = await executeQuery('SELECT * FROM Events WHERE EventID = ?', [req.params.id]);

        if (!event) {
            return res.status(404).render('error', {
                message: 'Event not found'
            });
        }

        // Debug log
        console.log('DEBUG: UserID:', req.user.UserID, 'Privileges:', req.user.privileges, 'Event OrganizerID:', event.OrganizerID);

        // Check if user has permission to edit this event
        if (!req.user.privileges?.Events?.update && req.user.UserID !== event.OrganizerID) {
            return res.status(403).render('error', {
                message: 'You do not have permission to edit this event'
            });
        }

        const [categories, venues] = await Promise.all([
            executeQuery('SELECT * FROM EventCategories ORDER BY CategoryName'),
            executeQuery('SELECT * FROM Venues ORDER BY Name')
        ]);

        res.render('event-form', {
            title: 'Edit Event',
            event,
            categories,
            venues,
            user: req.user
        });
    } catch (error) {
        console.error('Error loading event form:', error);
        res.status(500).render('error', {
            message: 'Error loading event form',
            error
        });
    }
});

// POST /events/edit/:id - Update event
router.post('/edit/:id', isAuthenticated, eventValidation, async (req, res) => {
    try {
        const [event] = await executeQuery('SELECT * FROM Events WHERE EventID = ?', [req.params.id]);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Debug log
        console.log('DEBUG: UserID:', req.user.UserID, 'Privileges:', req.user.privileges, 'Event OrganizerID:', event.OrganizerID);

        // Check if user has permission to edit this event
        if (!req.user.privileges?.Events?.update && req.user.UserID !== event.OrganizerID) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to edit this event'
            });
        }

        const {
            name, categoryId, eventType, status, eventDescription,
            date, time, registrationDeadline, venueId, maxParticipants,
            regFee, rules
        } = req.body;

        await executeQuery(`
            UPDATE Events SET
                Name = ?,
                CategoryID = ?,
                EventType = ?,
                Status = ?,
                EventDescription = ?,
                Date = ?,
                Time = ?,
                RegistrationDeadline = ?,
                VenueID = ?,
                Max_Participants = ?,
                Reg_Fee = ?,
                Rules = ?
            WHERE EventID = ?
        `, [
            name, categoryId, eventType, status, eventDescription,
            date, time, registrationDeadline, venueId, maxParticipants,
            regFee, rules, req.params.id
        ]);

        res.json({
            success: true,
            message: 'Event updated successfully'
        });
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({
            success: false,
            error: 'Error updating event'
        });
    }
});

// POST /events/delete/:id - Delete event
router.post('/delete/:id', isAuthenticated, async (req, res) => {
    try {
        const [event] = await executeQuery('SELECT * FROM Events WHERE EventID = ?', [req.params.id]);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Check if user has permission to delete this event
        if (!req.user.privileges?.Events?.delete && req.user.UserID !== event.OrganizerID) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this event'
            });
        }

        // Delete related records first
        await executeQuery('DELETE FROM EventJudges WHERE EventID = ?', [req.params.id]);
        await executeQuery('DELETE FROM Registrations WHERE EventID = ?', [req.params.id]);
        await executeQuery('DELETE FROM Teams WHERE EventID = ?', [req.params.id]);
        await executeQuery('DELETE FROM Scores WHERE EventID = ?', [req.params.id]);

        // Finally delete the event
        await executeQuery('DELETE FROM Events WHERE EventID = ?', [req.params.id]);

        // If it's an AJAX request, send JSON response
        if (req.xhr || req.headers.accept.includes('application/json')) {
            return res.json({
                success: true,
                message: 'Event deleted successfully'
            });
        }

        // Otherwise redirect to events page
        res.redirect('/events');
    } catch (error) {
        console.error('Error deleting event:', error);
        
        // If it's an AJAX request, send JSON response
        if (req.xhr || req.headers.accept.includes('application/json')) {
            return res.status(500).json({
                success: false,
                error: 'Error deleting event'
            });
        }

        // Otherwise render error page
        res.status(500).render('error', {
            message: 'Error deleting event',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// DELETE /events/:id - Delete event (AJAX)
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const [event] = await executeQuery('SELECT * FROM Events WHERE EventID = ?', [req.params.id]);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Check if user has permission to delete this event
        if (!req.user.privileges?.Events?.delete && req.user.UserID !== event.OrganizerID) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this event'
            });
        }

        // Delete related records first
        await executeQuery('DELETE FROM EventJudges WHERE EventID = ?', [req.params.id]);
        await executeQuery('DELETE FROM Registrations WHERE EventID = ?', [req.params.id]);
        await executeQuery('DELETE FROM Teams WHERE EventID = ?', [req.params.id]);
        await executeQuery('DELETE FROM Scores WHERE EventID = ?', [req.params.id]);

        // Finally delete the event
        await executeQuery('DELETE FROM Events WHERE EventID = ?', [req.params.id]);

        return res.json({
            success: true,
            message: 'Event deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting event:', error);
        return res.status(500).json({
            success: false,
            error: 'Error deleting event'
        });
    }
});

module.exports = router; 
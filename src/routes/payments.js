const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { isAuthenticated } = require('../middleware/auth');

// GET /payments - render payments page
router.get('/', isAuthenticated, async (req, res, next) => {
    try {
        res.render('payments', {
            title: 'Payments & Finance',
            user: req.user
        });
    } catch (error) {
        console.error('Error loading payments page:', error);
        next(error);
    }
});
router.post('/', isAuthenticated, async (req, res) => {
    const { amount, type } = req.body;
    await executeQuery(
      `INSERT INTO Payments (UserID, Amount, Type, Status) VALUES (?, ?, ?, 'paid')`,
      [req.session.user.id, amount, type]
    );
    res.json({ message: 'Payment recorded' });
  });
  
// POST /api/payments/registration - Process registration payment
router.post('/api/payments/registration', isAuthenticated, async (req, res, next) => {
    try {
        const { participantId, eventId, amount, paymentMethod } = req.body;

        // Validate request
        if (!participantId || !eventId || !amount || !paymentMethod) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Create payment record
        const createPaymentQuery = `
            INSERT INTO Payments (
                ParticipantUserID,
                Amount,
                PaymentMethod,
                Status,
                Description,
                PaymentDate
            ) VALUES (?, ?, ?, 'completed', 'Event Registration Payment', NOW())
        `;
        const result = await executeQuery(createPaymentQuery, [
            participantId,
            amount,
            paymentMethod
        ]);

        // Update registration payment status
        await executeQuery(`
            UPDATE Registrations 
            SET PaymentStatus = 'paid', 
                PaymentID = ? 
            WHERE UserID = ? AND EventID = ?
        `, [result.insertId, participantId, eventId]);

        res.status(201).json({
            message: 'Payment processed successfully',
            paymentId: result.insertId
        });
    } catch (error) {
        console.error('Error processing payment:', error);
        next(error);
    }
});

// POST /api/payments/sponsorship - Record sponsorship payment
router.post('/api/payments/sponsorship', async (req, res) => {
    try {
        const { sponsorId, amount, paymentMethod, description } = req.body;

        // Validate request
        if (!sponsorId || !amount || !paymentMethod) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Create sponsorship payment record
        const createPaymentQuery = `
            INSERT INTO Payments (
                SponsorID,
                Amount,
                PaymentMethod,
                Status,
                Description,
                PaymentDate
            ) VALUES (?, ?, ?, 'completed', ?, NOW())
        `;
        const result = await executeQuery(createPaymentQuery, [
            sponsorId,
            amount,
            paymentMethod,
            description || 'Sponsorship Payment'
        ]);

        res.status(201).json({
            message: 'Sponsorship payment recorded successfully',
            paymentId: result.insertId
        });
    } catch (error) {
        console.error('Error recording sponsorship payment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/payments/reports/registration - Generate registration revenue report
router.get('/api/payments/reports/registration', async (req, res) => {
    try {
        const report = await executeQuery(`
            SELECT 
                e.Name as EventName,
                COUNT(p.PaymentID) as TotalPayments,
                SUM(p.Amount) as TotalRevenue,
                COUNT(DISTINCT p.ParticipantUserID) as UniqueParticipants
            FROM Events e
            LEFT JOIN Registrations r ON e.EventID = r.EventID
            LEFT JOIN Payments p ON r.PaymentID = p.PaymentID
            WHERE p.ParticipantUserID IS NOT NULL
            GROUP BY e.EventID
            ORDER BY TotalRevenue DESC
        `);
        res.json(report);
    } catch (error) {
        console.error('Error generating registration report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/payments/reports/sponsorship - Generate sponsorship revenue report
router.get('/api/payments/reports/sponsorship', async (req, res) => {
    try {
        const report = await executeQuery(`
            SELECT 
                s.Name as SponsorName,
                s.SponsorshipLevel as SponsorshipTier,
                COUNT(p.PaymentID) as TotalPayments,
                SUM(p.Amount) as TotalAmount,
                MAX(p.PaymentDate) as LastPaymentDate
            FROM Sponsors s
            LEFT JOIN Payments p ON s.SponsorID = p.SponsorID
            WHERE p.SponsorID IS NOT NULL
            GROUP BY s.SponsorID
            ORDER BY TotalAmount DESC
        `);
        res.json(report);
    } catch (error) {
        console.error('Error generating sponsorship report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/payments/reports/accommodation - Generate accommodation revenue report
router.get('/api/payments/reports/accommodation', async (req, res) => {
    try {
        const report = await executeQuery(`
            SELECT 
                a.Name as AccommodationName,
                COUNT(ar.RequestID) as TotalRequests,
                SUM(ar.Budget) as TotalRevenue,
                AVG(ar.Budget) as AverageRevenue
            FROM Accommodations a
            LEFT JOIN AccommodationRequests ar ON a.AccommodationID = ar.AccommodationID
            WHERE ar.Status = 'Approved'
            GROUP BY a.AccommodationID
            ORDER BY TotalRevenue DESC
        `);
        res.json(report);
    } catch (error) {
        console.error('Error generating accommodation report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/events - Get all events for payment form
router.get('/events', async (req, res) => {
    try {
        const events = await executeQuery(`
            SELECT 
                e.EventID,
                e.Name,
                e.Date,
                e.Reg_Fee as Fee
            FROM Events e
            WHERE e.Status = 'Published'
            AND e.Date >= CURDATE()
            ORDER BY e.Date ASC
        `);
        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/sponsors - Get all sponsors for payment form
router.get('/sponsors', async (req, res) => {
    try {
        const sponsors = await executeQuery(`
            SELECT 
                s.SponsorID,
                s.Name,
                s.SponsorshipLevel
            FROM Sponsors s
            WHERE s.Status = 'active'
            ORDER BY s.SponsorshipLevel DESC, s.Name ASC
        `);
        res.json(sponsors);
    } catch (error) {
        console.error('Error fetching sponsors:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
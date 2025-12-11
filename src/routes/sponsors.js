const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');

// Get all sponsorship packages
router.get('/packages', async (req, res) => {
    try {
        const packages = await executeQuery('SELECT * FROM SponsorshipPackages ORDER BY Amount DESC');
        res.json(packages);
    } catch (error) {
        console.error('Error fetching sponsorship packages:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get sponsor's contract details
router.get('/:id/contract', async (req, res) => {
    try {
        const [contracts] = await executeQuery(`
            SELECT c.*, p.Category, p.Description, p.Benefits, p.Amount
            FROM SponsorshipContracts c
            JOIN SponsorshipPackages p ON c.PackageID = p.PackageID
            WHERE c.SponsorID = ?
            ORDER BY c.SignedDate DESC
        `, [req.params.id]);
        res.json(contracts);
    } catch (error) {
        console.error('Error fetching sponsor contract:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Sign new sponsorship contract
router.post('/:id/contract', async (req, res) => {
    const { packageId, startDate, endDate, terms } = req.body;
    try {
        const [result] = await executeQuery(`
            INSERT INTO SponsorshipContracts 
            (SponsorID, PackageID, SignedDate, StartDate, EndDate, Terms)
            VALUES (?, ?, CURDATE(), ?, ?, ?)
        `, [req.params.id, packageId, startDate, endDate, terms]);

        // Update sponsor's contract status
        await executeQuery(`
            UPDATE Sponsors
            SET ContractStatus = 'Active',
                ContractStartDate = ?,
                ContractEndDate = ?
            WHERE SponsorID = ?
        `, [startDate, endDate, req.params.id]);

        res.status(201).json({
            message: 'Contract signed successfully',
            contractId: result.insertId
        });
    } catch (error) {
        console.error('Error signing contract:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get sponsor's brand promotion details
router.get('/:id/promotions', async (req, res) => {
    try {
        const [sponsor] = await executeQuery(`
            SELECT SponsorID, Name, SponsorshipCategory, BrandPromotionDetails
            FROM Sponsors
            WHERE SponsorID = ?
        `, [req.params.id]);
        res.json(sponsor[0]);
    } catch (error) {
        console.error('Error fetching brand promotions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update brand promotion details
router.put('/:id/promotions', async (req, res) => {
    const { promotionDetails } = req.body;
    try {
        await executeQuery(`
            UPDATE Sponsors
            SET BrandPromotionDetails = ?
            WHERE SponsorID = ?
        `, [promotionDetails, req.params.id]);
        res.json({ message: 'Brand promotion details updated successfully' });
    } catch (error) {
        console.error('Error updating brand promotions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Generate sponsorship report
router.get('/reports/funds', async (req, res) => {
    try {
        const [report] = await executeQuery(`
            SELECT 
                s.SponsorshipCategory,
                COUNT(DISTINCT s.SponsorID) as SponsorCount,
                SUM(sp.Amount) as TotalFunds,
                GROUP_CONCAT(DISTINCT s.Name) as Sponsors
            FROM Sponsors s
            LEFT JOIN SponsorshipPayments sp ON s.SponsorID = sp.SponsorID
            GROUP BY s.SponsorshipCategory
            ORDER BY TotalFunds DESC
        `);
        res.json(report);
    } catch (error) {
        console.error('Error generating sponsorship report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all sponsors
router.get('/', async (req, res) => {
    try {
        const sponsors = await executeQuery(`
            SELECT s.*, 
                   COUNT(DISTINCT e.EventID) as EventCount,
                   SUM(p.Amount) as TotalContribution
            FROM Sponsors s
            LEFT JOIN Events e ON s.SponsorID = e.SponsorID
            LEFT JOIN SponsorshipContracts sc ON s.SponsorID = sc.SponsorID
            LEFT JOIN Payments p ON sc.ContractID = p.RelatedContractID
            GROUP BY s.SponsorID
            ORDER BY s.SponsorshipLevel DESC, s.Name ASC
        `);

        res.render('sponsors', {
            title: 'NASCON Sponsors',
            sponsors: sponsors,
            user: req.session.user || null
        });
    } catch (error) {
        console.error('Error fetching sponsors:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Error loading sponsors',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// Get single sponsor
router.get('/:id', async (req, res) => {
    try {
        const sponsors = await executeQuery(`
            SELECT s.*, 
                   COUNT(DISTINCT e.EventID) as EventCount,
                   SUM(p.Amount) as TotalContribution
            FROM Sponsors s
            LEFT JOIN Events e ON s.SponsorID = e.SponsorID
            LEFT JOIN Payments p ON s.SponsorID = p.SponsorID
            WHERE s.SponsorID = ?
            GROUP BY s.SponsorID
        `, [req.params.id]);

        if (sponsors.length === 0) {
            return res.status(404).json({ error: 'Sponsor not found' });
        }

        // Get sponsor's events
        const events = await executeQuery(`
            SELECT e.*, v.Name as VenueName
            FROM Events e
            LEFT JOIN Venues v ON e.VenueID = v.VenueID
            WHERE e.SponsorID = ?
            ORDER BY e.Date ASC
        `, [req.params.id]);

        // Get sponsor's payments
        const payments = await executeQuery(`
            SELECT *
            FROM Payments
            WHERE SponsorID = ?
            ORDER BY PaymentDate DESC
        `, [req.params.id]);

        res.json({
            ...sponsors[0],
            events,
            payments
        });
    } catch (error) {
        console.error('Error fetching sponsor:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new sponsor (protected route)
router.post('/', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
        name,
        contact,
        email,
        phone,
        category,
        sponsorshipLevel,
        amount,
        website
    } = req.body;

    try {
        const result = await executeQuery(`
            INSERT INTO Sponsors (
                Name, Contact, Email, Phone, Category, 
                SponsorshipLevel, Amount, Website, Status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `, [name, contact, email, phone, category, sponsorshipLevel, amount, website]);

        res.status(201).json({
            message: 'Sponsor created successfully',
            sponsorId: result.insertId
        });
    } catch (error) {
        console.error('Error creating sponsor:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update sponsor (protected route)
router.put('/:id', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
        name,
        contact,
        email,
        phone,
        category,
        sponsorshipLevel,
        amount,
        website,
        status
    } = req.body;

    try {
        const result = await executeQuery(`
            UPDATE Sponsors
            SET Name = ?, Contact = ?, Email = ?, Phone = ?, 
                Category = ?, SponsorshipLevel = ?, Amount = ?,
                Website = ?, Status = ?
            WHERE SponsorID = ?
        `, [name, contact, email, phone, category, sponsorshipLevel, amount, website, status, req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Sponsor not found' });
        }

        res.json({ message: 'Sponsor updated successfully' });
    } catch (error) {
        console.error('Error updating sponsor:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete sponsor (protected route)
router.delete('/:id', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        // Check if sponsor has associated events
        const events = await executeQuery(`
            SELECT COUNT(*) as count
            FROM Events
            WHERE SponsorID = ?
        `, [req.params.id]);

        if (events[0].count > 0) {
            return res.status(400).json({
                error: 'Cannot delete sponsor with associated events'
            });
        }

        const result = await executeQuery(`
            DELETE FROM Sponsors
            WHERE SponsorID = ?
        `, [req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Sponsor not found' });
        }

        res.json({ message: 'Sponsor deleted successfully' });
    } catch (error) {
        console.error('Error deleting sponsor:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { executeQuery } = require('../config/database');
const passwordValidator = require('../utils/passwordValidator');
const { registerValidation } = require('../middleware/validation');
const { isAuthenticated } = require('../middleware/auth');

// Mapping allowed roles
const roleMapping = {
  '1': 1, // participant
  '2': 2, // event_organizer
  '3': 3, // sponsor
  '4': 4  // judge
};

// GET /register - Render registration page
router.get('/', (req, res) => {
  res.render('registration', {
    title: 'NASCON Registration',
    user: req.session.user || null,
    error: null
  });
});

// POST /register/api/register - Register a new user
router.post('/api/register', registerValidation, async (req, res) => {
  try {
    const { name, email, password, contact, username, roleId } = req.body;
    console.log('Registration attempt:', { name, email, username, roleId });

    // Validate roleId
    const resolvedRoleId = roleMapping[roleId];
    if (!resolvedRoleId) {
      console.warn('Role validation failed:', { roleId, resolvedRoleId });
      return res.status(400).json({ error: 'Invalid role selected' });
    }

    // Check for existing email
    console.log('Checking for existing email:', email);
    const existingEmail = await executeQuery(
      'SELECT UserID FROM Users WHERE Email = ?',
      [email]
    );
    if (existingEmail.length > 0) {
      console.warn('Email already exists:', email);
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Check for existing username
    console.log('Checking for existing username:', username);
    const existingUser = await executeQuery(
      'SELECT UserID FROM Users WHERE username = ?',
      [username]
    );
    if (existingUser.length > 0) {
      console.warn('Username already exists:', username);
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Validate password complexity
    if (!passwordValidator(password)) {
      console.warn('Password validation failed');
      return res.status(400).json({ error: 'Password does not meet complexity requirements' });
    }

    // Hash password
    console.log('Hashing password...');
    const hashed = await bcrypt.hash(password, 10);

    // Insert user
    console.log('Attempting to insert user into database...');
    const insertSql = `
      INSERT INTO Users (
        Name, Email, Password, Contact, username,
        RoleID, Status, LastLogin, CreatedAt, UpdatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, 'active', NULL, NOW(), NOW())
    `;
    const result = await executeQuery(insertSql, [
      name,
      email,
      hashed,
      contact || null,
      username,
      resolvedRoleId
    ]);
    console.log('User inserted successfully:', result);

    // Return success response
    return res.status(201).json({ 
      message: 'Registration successful',
      user: {
        name,
        email,
        username,
        roleId: resolvedRoleId
      }
    });
  } catch (err) {
    console.error('Error in registration:', err);
    console.error('Error details:', {
      message: err.message,
      code: err.code,
      sqlMessage: err.sqlMessage,
      sqlState: err.sqlState
    });
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// POST /registration/api/registrations - API event registration
router.post('/api/registrations', async (req, res) => {
  try {
    const { userId, eventId } = req.body;
    if (!userId || !eventId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const user = await executeQuery(
      'SELECT UserID FROM Users WHERE UserID = ?',
      [userId]
    );
    if (user.length === 0) return res.status(404).json({ error: 'User not found' });

    const event = await executeQuery(
      'SELECT EventID FROM Events WHERE EventID = ?',
      [eventId]
    );
    if (event.length === 0) return res.status(404).json({ error: 'Event not found' });

    const exists = await executeQuery(
      'SELECT * FROM Registrations WHERE UserID = ? AND EventID = ?',
      [userId, eventId]
    );
    if (exists.length > 0) return res.status(400).json({ error: 'Already registered' });

    await executeQuery(
      'INSERT INTO Registrations (UserID, EventID, PaymentStatus) VALUES (?, ?, ?)',
      [userId, eventId, 'Pending']
    );
    res.status(201).json({ message: 'Registration successful' });
  } catch (err) {
    console.error('Registration API error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /registration - User-facing event registration
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.UserID;
    const { eventId, specialRequirements } = req.body;

    const event = await executeQuery(
      'SELECT * FROM Events WHERE EventID = ?',
      [eventId]
    );
    if (event.length === 0) {
      return res.status(404).render('error', { message: 'Event not found' });
    }

    const existingReg = await executeQuery(
      'SELECT RegistrationID FROM Registrations WHERE EventID = ? AND UserID = ?',
      [eventId, userId]
    );
    if (existingReg.length > 0) {
      return res.status(400).render('error', { message: 'Already registered' });
    }

    const insert = await executeQuery(
      `INSERT INTO Registrations (UserID, EventID, PaymentStatus, Status, RegistrationDate, SpecialRequirements)
       VALUES (?, ?, ?, ?, NOW(), ?)`,
      [userId, eventId, 'pending', 'pending', specialRequirements || null]
    );
    res.redirect(`/registration/success?id=${insert.insertId}`);
  } catch (err) {
    console.error('Error creating registration:', err);
    res.status(500).render('error', { message: 'Registration failed' });
  }
});

// GET /registration/success - Confirmation
router.get('/success', isAuthenticated, async (req, res) => {
  try {
    const regId = req.query.id;
    const userId = req.session.user.UserID;

    const rows = await executeQuery(
      `SELECT r.*, e.Name AS EventName, e.Date AS EventDate, e.Time AS EventTime,
              e.Reg_Fee AS RegistrationFee, e.EventType,
              v.Name AS VenueName, t.TeamName
       FROM Registrations r
       JOIN Events e ON r.EventID = e.EventID
       LEFT JOIN Venues v ON e.VenueID = v.VenueID
       LEFT JOIN Teams t ON r.TeamID = t.TeamID
       WHERE r.RegistrationID = ? AND r.UserID = ?`,
      [regId, userId]
    );
    if (rows.length === 0) {
      return res.status(404).render('error', { message: 'Registration not found' });
    }
    const registration = rows[0];

    let team = null;
    if (['Team', 'Both'].includes(registration.EventType)) {
      const tRows = await executeQuery(
        `SELECT t.*, COUNT(tm.UserID) AS MemberCount
         FROM Teams t
         LEFT JOIN TeamMembers tm ON t.TeamID = tm.TeamID
         WHERE t.EventID = ? AND t.LeaderID = ?
         GROUP BY t.TeamID`,
        [registration.EventID, userId]
      );
      if (tRows.length) {
        team = tRows[0];
        team.members = await executeQuery(
          `SELECT u.Name, u.Email, tm.Role, tm.Status
           FROM TeamMembers tm
           JOIN Users u ON tm.UserID = u.UserID
           WHERE tm.TeamID = ?
           ORDER BY tm.Role DESC, u.Name ASC`,
          [team.TeamID]
        );
      }
    }
    res.render('registration-success', { title: 'Registration Successful', registration, team, user: req.session.user });
  } catch (err) {
    console.error('Success page error:', err);
    res.status(500).render('error', { message: 'Failed to load details' });
  }
});

// PATCH /registration/:id - Update registration
router.patch('/:id', isAuthenticated, async (req, res) => {
  try {
    const regId = req.params.id;
    const userId = req.session.user.UserID;
    const { teamId } = req.body;

    const rows = await executeQuery(
      'SELECT * FROM Registrations WHERE RegistrationID = ? AND UserID = ?',
      [regId, userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }

    await executeQuery(
      'UPDATE Registrations SET TeamID = ? WHERE RegistrationID = ?',
      [teamId, regId]
    );
    res.json({ message: 'Updated' });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'Update failed' });
  }
});

module.exports = router;

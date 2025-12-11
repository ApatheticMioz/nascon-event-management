const { executeQuery } = require('../config/database');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: 'Unauthorized' });
};

// Middleware to check if user is a judge
const isJudge = async (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const query = `
            SELECT j.JudgeID, j.Status
            FROM Judges j
            WHERE j.UserID = ?
        `;
        const result = await executeQuery(query, [req.user.UserID]);
        
        if (result.length > 0 && result[0].Status === 'active') {
            req.judgeId = result[0].JudgeID;
            return next();
        }
        
        res.status(403).json({ error: 'Forbidden - User is not an active judge' });
    } catch (error) {
        console.error('Error checking judge status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Middleware to check user privileges
const hasPrivilege = (resource, action = 'create') => {
    return (req, res, next) => {
        if (!req.user || !req.user.privileges) {
            return res.status(403).json({ error: 'Access denied: No privileges found.' });
        }
        // Normalize resource/action
        const resKey = resource.charAt(0).toUpperCase() + resource.slice(1);
        const actKey = action.toLowerCase();
        // Example: req.user.privileges.Events.create === true
        if (
            req.user.privileges[resKey] &&
            req.user.privileges[resKey][actKey]
        ) {
            return next();
        }
        return res.status(403).json({ error: `Access denied: Missing privilege for ${resource}.${action}` });
    };
};

// Middleware to check if user has admin role
const isAdmin = async (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const query = `
            SELECT RoleName
            FROM Users u
            JOIN Roles r ON u.RoleID = r.RoleID
            WHERE u.UserID = ?
        `;
        const result = await executeQuery(query, [req.user.UserID]);
        
        if (result[0].RoleName === 'admin') {
            return next();
        }
        
        res.status(403).json({ error: 'Forbidden' });
    } catch (error) {
        console.error('Error checking admin role:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// middleware/auth.js
function requireRole(roleName) {
    return function (req, res, next) {
      if (!req.session.user || req.session.user.role !== roleName) {
        return res.status(403).send('Forbidden');
      }
      next();
    }
  }

// Middleware to populate req.user.privileges from DB (if not already)
async function populatePrivileges(req, res, next) {
    if (req.user && !req.user.privileges) {
        try {
            const { executeQuery } = require('../config/database');
            const rows = await executeQuery(
                'SELECT Resource, Action FROM RolePrivileges WHERE RoleID = ?',
                [req.user.RoleID]
            );
            req.user.privileges = {};
            for (const row of rows) {
                if (!req.user.privileges[row.Resource]) req.user.privileges[row.Resource] = {};
                req.user.privileges[row.Resource][row.Action] = true;
            }
        } catch (err) {
            console.error('Error populating privileges:', err);
            req.user.privileges = {};
        }
    }
    next();
}

module.exports = {
    isAuthenticated,
    hasPrivilege,
    isAdmin,
    requireRole,
    isJudge,
    populatePrivileges
}; 
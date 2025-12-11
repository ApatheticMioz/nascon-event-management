const passport = require('passport');
const { executeQuery } = require('./database');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

passport.serializeUser((user, done) => {
    done(null, user.UserID);
});

passport.deserializeUser(async (id, done) => {
    try {
        const query = `
            SELECT u.UserID, u.Name, u.Email, u.username, u.RoleID, r.RoleName as Role
            FROM Users u
            JOIN Roles r ON u.RoleID = r.RoleID
            WHERE u.UserID = ?
        `;
        const users = await executeQuery(query, [id]);
        
        if (users.length === 0) {
            return done(null, false);
        }
        
        const user = users[0];
        // Load privileges from RolePrivileges and UserPrivileges
        const rolePrivs = await executeQuery(
            'SELECT Resource, Action FROM RolePrivileges WHERE RoleID = ?',
            [user.RoleID]
        );
        const userPrivs = await executeQuery(
            'SELECT Resource, Action FROM UserPrivileges WHERE UserID = ?',
            [user.UserID]
        );
        // Merge privileges into a nested object: { Resource: { action: true } }
        user.privileges = {};
        for (const priv of rolePrivs.concat(userPrivs)) {
            if (!user.privileges[priv.Resource]) user.privileges[priv.Resource] = {};
            user.privileges[priv.Resource][priv.Action] = true;
        }
        console.log('DEBUG: Loaded privileges for user', user.UserID, ':', user.privileges);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// Register the local strategy
passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
        const query = `
            SELECT u.UserID, u.Name, u.Email, u.Password, u.username, u.RoleID, r.RoleName as Role
            FROM Users u
            JOIN Roles r ON u.RoleID = r.RoleID
            WHERE u.Email = ?
        `;
        const users = await executeQuery(query, [email]);
        if (users.length === 0) {
            return done(null, false, { message: 'Invalid email or password' });
        }
        const user = users[0];
        const passwordMatch = await bcrypt.compare(password, user.Password);
        if (!passwordMatch) {
            return done(null, false, { message: 'Invalid email or password' });
        }
        // Load privileges after login
        const rolePrivs = await executeQuery(
            'SELECT Resource, Action FROM RolePrivileges WHERE RoleID = ?',
            [user.RoleID]
        );
        let userPrivs = [];
        try {
            userPrivs = await executeQuery(
                'SELECT Resource, Action FROM UserPrivileges WHERE UserID = ?',
                [user.UserID]
            );
        } catch (e) { userPrivs = []; }
        user.privileges = {};
        for (const priv of rolePrivs.concat(userPrivs)) {
            if (!user.privileges[priv.Resource]) user.privileges[priv.Resource] = {};
            user.privileges[priv.Resource][priv.Action] = true;
        }
        console.log('DEBUG: Loaded privileges after login for user', user.UserID, ':', user.privileges);
        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));

module.exports = passport;
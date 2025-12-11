// Notification middleware
function notification(req, res, next) {
    // Get notification from session and clear it
    res.locals.notification = req.session.notification;
    delete req.session.notification;
    next();
}

// Helper function to set notification
function setNotification(req, message, type = 'info') {
    req.session.notification = { message, type };
}

module.exports = {
    notification,
    setNotification
}; 
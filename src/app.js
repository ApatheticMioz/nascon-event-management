const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const path = require('path');
const passport = require('./config/passport');
const { notification } = require('./middleware/notification');
const { isAuthenticated, hasPrivilege, populatePrivileges } = require('./middleware/auth');
require('dotenv').config();

const app = express();

// Import routes
const eventsRouter = require('./routes/events');
const sponsorsRouter = require('./routes/sponsors');
const aboutRouter = require('./routes/about');
const competitionsRouter = require('./routes/competitions');
const workshopsRouter = require('./routes/workshops');
const registrationRouter = require('./routes/registration');
const accommodationsRouter = require('./routes/accommodations');
const loginRouter = require('./routes/login');
const authRoutes = require('./routes/auth');
const contactRouter = require('./routes/contact');
const faqRoutes = require('./routes/faq');
const scheduleRouter = require('./routes/schedule');
const indexRouter = require('./routes/index');
const paymentsRouter = require('./routes/payments');
const venuesRouter = require('./routes/venues');
const categoriesRouter = require('./routes/categories');
const teamsRouter = require('./routes/teams');
const judgesRouter = require('./routes/judges');
const scoresRouter = require('./routes/scores');

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Populate user privileges for all requests
app.use(populatePrivileges);

// Add notification middleware
app.use(notification);

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.get('/', (req, res) => {
    res.render('index', {
        title: 'NASCON - Home',
        user: req.session.user || null
    });
});

// Public routes
app.use('/auth', require('./routes/auth'));
app.use('/register', require('./routes/registration'));
app.use('/login', loginRouter);
app.use('/public', express.static(path.join(__dirname, 'public')));

// Require authentication for all other routes
app.use(isAuthenticated);

// Protected routes
app.use('/events', hasPrivilege('Events', 'read'), require('./routes/events'));
app.use('/venues', hasPrivilege('Venues', 'read'), require('./routes/venues'));
app.use('/sponsors', hasPrivilege('Sponsors', 'read'), require('./routes/sponsors'));
app.use('/accommodations', hasPrivilege('Accommodations', 'read'), require('./routes/accommodations'));
app.use('/payments', hasPrivilege('Payments', 'read'), require('./routes/payments'));
app.use('/judges', hasPrivilege('Judges', 'read'), require('./routes/judges'));
app.use('/scores', hasPrivilege('Scores', 'read'), require('./routes/scores'));

// Page Routes
app.use('/about', aboutRouter);
app.use('/competitions', competitionsRouter);
app.use('/workshops', workshopsRouter);
app.use('/contact', contactRouter);
app.use('/faq', faqRoutes);
app.use('/schedule', scheduleRouter);
app.use('/categories', categoriesRouter);
app.use('/teams', teamsRouter);
app.use('/', indexRouter);

// API Routes
app.use('/api/events', eventsRouter);
app.use('/api/sponsors', sponsorsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/venues', venuesRouter);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).render('error', {
        title: 'Error',
        message: err.message || 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err : {},
        user: req.user || null
    });
});

// 404 handler - must be after all other routes
app.use((req, res) => {
    res.status(404).render('error', {
        title: '404 Not Found',
        message: 'The page you are looking for does not exist.',
        error: {},
        user: req.user || null
    });
});

const PORT = process.env.PORT || 3000;

const startServer = () => {
    try {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        if (error.code === 'EADDRINUSE') {
            console.log(`Port ${PORT} is busy, trying ${PORT + 1}...`);
            process.env.PORT = PORT + 1;
            startServer();
        } else {
            console.error('Error starting server:', error);
        }
    }
};

startServer();

module.exports = app; 
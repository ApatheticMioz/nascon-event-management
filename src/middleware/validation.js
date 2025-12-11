const { body, validationResult } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// User registration validation rules
const registerValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .isLength({ max: 50 }).withMessage('Email must not exceed 50 characters')
        .normalizeEmail(),
    
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 3, max: 255 }).withMessage('Username must be between 3 and 255 characters')
        .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Username can only contain letters, numbers, underscores and hyphens'),
    
    body('password')
        .trim()
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'),
    
    body('contact')
        .optional()
        .trim()
        .isLength({ max: 20 }).withMessage('Contact number must not exceed 20 characters')
        .matches(/^\+?[\d\s-]{10,}$/).withMessage('Invalid phone number format'),
    
    body('roleId')
        .notEmpty().withMessage('Role is required')
        .isInt().withMessage('Invalid role ID'),

    validate
];

// Event creation validation rules
const eventValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Event name is required')
        .isLength({ min: 3, max: 100 }).withMessage('Event name must be between 3 and 100 characters'),
    
    body('date')
        .trim()
        .notEmpty().withMessage('Event date is required')
        .isISO8601().withMessage('Invalid date format')
        .custom((value) => {
            const eventDate = new Date(value);
            if (eventDate < new Date()) {
                throw new Error('Event date cannot be in the past');
            }
            return true;
        }),
    
    body('time')
        .trim()
        .notEmpty().withMessage('Event time is required')
        .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:MM)'),
    
    body('Reg_Fee')
        .optional()
        .isFloat({ min: 0 }).withMessage('Registration fee must be a non-negative number'),
    
    body('Max_Participants')
        .optional()
        .isInt({ min: 1 }).withMessage('Maximum participants must be a positive number'),
    
    body('Rules')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Rules must not exceed 1000 characters'),
    
    body('EventDescription')
        .optional()
        .trim()
        .isLength({ max: 2000 }).withMessage('Event description must not exceed 2000 characters'),
    
    body('VenueID')
        .optional()
        .isInt({ min: 1 }).withMessage('Invalid venue ID'),
    
    body('CategoryID')
        .notEmpty().withMessage('Category is required')
        .isInt({ min: 1 }).withMessage('Invalid category ID'),
    
    body('EventType')
        .trim()
        .notEmpty().withMessage('Event type is required')
        .isIn(['Individual', 'Team', 'Both']).withMessage('Invalid event type'),
    
    body('RegistrationDeadline')
        .trim()
        .notEmpty().withMessage('Registration deadline is required')
        .isISO8601().withMessage('Invalid date format')
        .custom((value, { req }) => {
            const deadline = new Date(value);
            const eventDate = new Date(req.body.date);
            if (deadline >= eventDate) {
                throw new Error('Registration deadline must be before event date');
            }
            return true;
        }),
    
    body('Status')
        .optional()
        .trim()
        .isIn(['Draft', 'Published', 'Ongoing', 'Completed', 'Cancelled']).withMessage('Invalid status'),
    
    validate
];

module.exports = {
    registerValidation,
    eventValidation
}; 
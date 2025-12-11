const { body, validationResult } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Venue validation rules
const venueValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Venue name is required')
        .isLength({ max: 100 }).withMessage('Venue name must not exceed 100 characters'),
    
    body('address')
        .trim()
        .notEmpty().withMessage('Address is required')
        .isLength({ max: 255 }).withMessage('Address must not exceed 255 characters'),
    
    body('location')
        .optional()
        .trim()
        .isLength({ max: 255 }).withMessage('Location must not exceed 255 characters'),
    
    body('capacity')
        .optional()
        .isInt({ min: 1 }).withMessage('Capacity must be a positive number'),
    
    body('availability')
        .optional()
        .trim()
        .isLength({ max: 50 }).withMessage('Availability must not exceed 50 characters'),
    
    body('facilities')
        .optional()
        .trim(),
    
    body('mapEmbedURL')
        .optional()
        .trim(),
    
    body('description')
        .optional()
        .trim(),
    
    body('contactPerson')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Contact person name must not exceed 100 characters'),
    
    body('contactEmail')
        .optional()
        .trim()
        .isEmail().withMessage('Invalid email format')
        .isLength({ max: 100 }).withMessage('Contact email must not exceed 100 characters'),
    
    body('contactPhone')
        .optional()
        .trim()
        .isLength({ max: 20 }).withMessage('Contact phone must not exceed 20 characters')
        .matches(/^\+?[\d\s-]{10,}$/).withMessage('Invalid phone number format'),
    
    body('venueType')
        .trim()
        .notEmpty().withMessage('Venue type is required')
        .isIn(['Auditorium', 'Hall', 'Lab', 'Outdoor Space']).withMessage('Invalid venue type'),
    
    body('status')
        .optional()
        .trim()
        .isIn(['Available', 'Under Maintenance', 'Unavailable']).withMessage('Invalid status'),
    
    body('equipment')
        .optional()
        .trim(),
    
    body('restrictions')
        .optional()
        .trim(),
    
    validate
];

module.exports = {
    venueValidation
}; 
/**
 * Validates password complexity
 * @param {string} password - The password to validate
 * @returns {boolean} - True if password meets requirements, false otherwise
 */
function passwordValidator(password) {
    // Password must be at least 8 characters long
    if (password.length < 8) {
        return false;
    }

    // Password must contain at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
        return false;
    }

    // Password must contain at least one lowercase letter
    if (!/[a-z]/.test(password)) {
        return false;
    }

    // Password must contain at least one number
    if (!/[0-9]/.test(password)) {
        return false;
    }

    // Password must contain at least one special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return false;
    }

    return true;
}

module.exports = passwordValidator; 
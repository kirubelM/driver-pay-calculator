// src/utils/adminConfig.js

/**
 * Hardcoded list of admin email addresses
 * Add or remove emails here to manage admin access
 */
const ADMIN_EMAILS = [
    'admin@bba.com',
    'manager@bba.com',
    'zewdukirubel7@gmail.com'
    // Add more admin emails here
];

/**
 * Check if a user is an admin based on their email
 * @param {string} email - User's email address
 * @returns {boolean} - True if user is an admin
 */
export const isAdmin = (email) => {
    if (!email) return false;
    const result = ADMIN_EMAILS.includes(email.toLowerCase().trim());
    console.log('🔍 isAdmin check:', email, '→', result);
    return result;
};

/**
 * Get the current user's email from auth
 * @param {Object} auth - Firebase auth object
 * @returns {string|null} - User's email or null
 */
export const getCurrentUserEmail = (auth) => {
    return auth.currentUser?.email || null;
};

/**
 * Check if current user is an admin
 * @param {Object} auth - Firebase auth object
 * @returns {boolean} - True if current user is an admin
 */
export const isCurrentUserAdmin = (auth) => {
    const email = getCurrentUserEmail(auth);
    const adminStatus = isAdmin(email);
    console.log('✅ isCurrentUserAdmin:', email, '→', adminStatus);
    return adminStatus;
};

export default {
    ADMIN_EMAILS,
    isAdmin,
    getCurrentUserEmail,
    isCurrentUserAdmin
};
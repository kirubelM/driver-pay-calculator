// src/utils/adminConfig.js

/**
 * Hardcoded list of admin email addresses
 * Add or remove emails here to manage admin access
 * 
 * IMPORTANT: Make sure emails are in lowercase and exactly match
 * the email addresses used in Firebase Authentication
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
    if (!email) {
        console.log('🔍 isAdmin: No email provided');
        return false;
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    const result = ADMIN_EMAILS.includes(normalizedEmail);
    
    console.log('🔍 isAdmin check:');
    console.log('   Input email:', email);
    console.log('   Normalized:', normalizedEmail);
    console.log('   Admin emails:', ADMIN_EMAILS);
    console.log('   Result:', result);
    
    return result;
};

/**
 * Get the current user's email from auth
 * @param {Object} auth - Firebase auth object
 * @returns {string|null} - User's email or null
 */
export const getCurrentUserEmail = (auth) => {
    const email = auth.currentUser?.email || null;
    console.log('📧 getCurrentUserEmail:', email);
    return email;
};

/**
 * Check if current user is an admin
 * @param {Object} auth - Firebase auth object
 * @returns {boolean} - True if current user is an admin
 */
export const isCurrentUserAdmin = (auth) => {
    const email = getCurrentUserEmail(auth);
    const adminStatus = isAdmin(email);
    
    console.log('✅ isCurrentUserAdmin:');
    console.log('   Email:', email);
    console.log('   Is Admin:', adminStatus);
    
    return adminStatus;
};


const adminConfig = {
    ADMIN_EMAILS,
    isAdmin,
    getCurrentUserEmail,
    isCurrentUserAdmin
};

export default adminConfig;
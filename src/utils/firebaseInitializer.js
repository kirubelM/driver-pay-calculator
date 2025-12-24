// src/utils/firebaseInitializer.js

import { db, auth } from '../firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const defaultDriverData = {
  "Adisu J": { dailyRate: 200, hourlyRate: 20, daysWorked: 0, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Barnabas": { dailyRate: 220, hourlyRate: 22, daysWorked: 0, hoursWorked: 0, expense1099: 0, comments: "" },
  "Birhanu": { dailyRate: 200, hourlyRate: 20, daysWorked: 0, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Daniel": { dailyRate: 220, hourlyRate: 22, daysWorked: 0, hoursWorked: 0, expense1099: 0, comments: "" },
  "Dawit": { dailyRate: 200, hourlyRate: 20, daysWorked: 0, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Eshetu": { dailyRate: 200, hourlyRate: 20, daysWorked: 0, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Eyouel": { dailyRate: 220, hourlyRate: 22, daysWorked: 0, hoursWorked: 0, expense1099: 0, comments: "-" }, 
  "Kaleab": { dailyRate: 220, hourlyRate: 22, daysWorked: 0, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Kirubel": { dailyRate: 210, hourlyRate: 21, daysWorked: 0, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Mulugeta": { dailyRate: 220, hourlyRate: 22, daysWorked: 0, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Mussie": { dailyRate: 220, hourlyRate: 22, daysWorked: 0, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Semira": { dailyRate: 140, hourlyRate: 20, daysWorked: 0, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Tekle": { dailyRate: 264, hourlyRate: 22, daysWorked: 0, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Yared": { dailyRate: 242, hourlyRate: 22, daysWorked: 0, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Yordanos": { dailyRate: 250, hourlyRate: 0, daysWorked: 0, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Zekarias": { dailyRate: 242, hourlyRate: 22, daysWorked: 0, hoursWorked: 0, expense1099: 0, comments: "-" }
};

/**
 * Initialize user's payroll data structure in Firestore
 * This function checks if the user already has data, and only creates it if missing
 * 
 * @returns {Promise<Object>} Result object with success status and message
 */
export const initializeUserPayrollData = async () => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      return {
        success: false,
        message: "No user is currently logged in."
      };
    }

    const userId = user.uid;
    const currentDataRef = doc(db, "users", userId, "payroll", "currentData");
    
    // Check if user already has data
    const docSnap = await getDoc(currentDataRef);
    
    if (docSnap.exists()) {
      return {
        success: true,
        message: "User data already exists. No initialization needed.",
        alreadyExists: true
      };
    }

    // Create initial data structure
    await setDoc(currentDataRef, {
      driverData: defaultDriverData,
      payResults: [],
      totalPay: 0,
      lastSaved: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      userEmail: user.email
    });

    console.log(`✅ Initialized payroll data for user: ${user.email} (${userId})`);

    return {
      success: true,
      message: "User payroll data initialized successfully!",
      userId: userId,
      userEmail: user.email,
      alreadyExists: false
    };

  } catch (error) {
    console.error("❌ Error initializing user data:", error);
    return {
      success: false,
      message: `Failed to initialize: ${error.message}`,
      error: error
    };
  }
};

/**
 * Check if user's payroll data exists
 * 
 * @returns {Promise<boolean>} True if data exists, false otherwise
 */
export const checkUserDataExists = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return false;

    const userId = user.uid;
    const currentDataRef = doc(db, "users", userId, "payroll", "currentData");
    const docSnap = await getDoc(currentDataRef);

    return docSnap.exists();
  } catch (error) {
    console.error("Error checking user data:", error);
    return false;
  }
};

/**
 * Reset user's current payroll data to defaults
 * CAUTION: This will overwrite current data
 * 
 * @returns {Promise<Object>} Result object with success status and message
 */
export const resetUserPayrollData = async () => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      return {
        success: false,
        message: "No user is currently logged in."
      };
    }

    const userId = user.uid;
    const currentDataRef = doc(db, "users", userId, "payroll", "currentData");

    await setDoc(currentDataRef, {
      driverData: defaultDriverData,
      payResults: [],
      totalPay: 0,
      lastSaved: new Date().toISOString(),
      resetAt: new Date().toISOString()
    });

    console.log(`✅ Reset payroll data for user: ${user.email}`);

    return {
      success: true,
      message: "User payroll data reset successfully!"
    };

  } catch (error) {
    console.error("❌ Error resetting user data:", error);
    return {
      success: false,
      message: `Failed to reset: ${error.message}`,
      error: error
    };
  }
};

/**
 * Get database info for current user
 * Useful for debugging and verification
 * 
 * @returns {Promise<Object>} Database information
 */
export const getUserDatabaseInfo = async () => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      return {
        success: false,
        message: "No user is currently logged in."
      };
    }

    const userId = user.uid;
    const currentDataRef = doc(db, "users", userId, "payroll", "currentData");
    const docSnap = await getDoc(currentDataRef);

    if (!docSnap.exists()) {
      return {
        success: true,
        exists: false,
        message: "No data found for this user.",
        userId: userId,
        userEmail: user.email,
        path: `users/${userId}/payroll/currentData`
      };
    }

    const data = docSnap.data();

    return {
      success: true,
      exists: true,
      userId: userId,
      userEmail: user.email,
      path: `users/${userId}/payroll/currentData`,
      data: {
        numberOfDrivers: Object.keys(data.driverData || {}).length,
        hasPayResults: (data.payResults || []).length > 0,
        totalPay: data.totalPay || 0,
        lastSaved: data.lastSaved,
        createdAt: data.createdAt
      }
    };

  } catch (error) {
    console.error("Error getting database info:", error);
    return {
      success: false,
      message: `Failed to get info: ${error.message}`,
      error: error
    };
  }
};

// Export all functions as default for easy importing
export default {
  initializeUserPayrollData,
  checkUserDataExists,
  resetUserPayrollData,
  getUserDatabaseInfo
};
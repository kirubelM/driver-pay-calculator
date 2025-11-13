/* global __firebase_config, __initial_auth_token */
import React, { useState, useEffect } from 'react';
import { Lock, Mail, Eye, EyeOff, LogIn, AlertCircle, UserPlus, HelpCircle } from 'lucide-react';

// Import Firebase Auth functions
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    signInAnonymously, 
    signInWithCustomToken,
    signInWithEmailAndPassword, 
    signInWithPopup, 
    GoogleAuthProvider,
    createUserWithEmailAndPassword, // Import for registration
    sendPasswordResetEmail      // Import for password reset
} from 'firebase/auth';

// --- Non-import declarations start here ---

import BBA_LOGO from '../img/as.png'; // Removed: Cannot resolve local file in this environment

// Define a safe, non-functional dummy configuration for development fallback
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyA0CTuFY9ZgND2YvekIAD7n6Hj8XUA8u1I",
  authDomain: "bba-payroll-calculator.firebaseapp.com",
  projectId: "bba-payroll-calculator",
  storageBucket: "bba-payroll-calculator.firebasestorage.app",
  messagingSenderId: "239862416938",
  appId: "1:239862416938:web:6a81b8ea348f4dc5ef6553",
  measurementId: "G-QY5VFEQ8R4"
};


const LoginPage = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    // State to toggle between Login and Register modes
    const [isRegisterView, setIsRegisterView] = useState(false);
    
    const [error, setError] = useState('');
    const [notification, setNotification] = useState(''); // For success/info messages
    const [isLoading, setIsLoading] = useState(false);

    // Add state for Firebase auth object
    const [auth, setAuth] = useState(null);

    // Initialize Firebase and Auth
    useEffect(() => {
        let config = {}; // Start with an empty config object
        let authEnabled = true;
        
        try {
            // 1. Attempt to SAFELY parse the real config from the environment
            if (typeof __firebase_config === 'string' && __firebase_config.length > 2) {
                try {
                    // Try to parse. If this fails (due to bad JSON), 'config' remains {}
                    config = JSON.parse(__firebase_config); 
                } catch (parseError) {
                    console.error("Error parsing __firebase_config JSON. Using fallback configuration.", parseError);
                    // The critical error should now be prevented, and we rely on the fallback below.
                }
            }
            
            // 2. Check if the config is valid (will fail if parsing failed above)
            if (!config || !config.apiKey || config.apiKey === 'AIzaSyA0CTuFY9ZgND2YvekIAD7n6Hj8XUA8u1I ') {
                console.warn("Using DUMMY Firebase configuration. Actual authentication will fail.");
                
                // Use the dummy config if the real one is missing or invalid
                config = FIREBASE_CONFIG;
                
                // Set a clear notification for the user
                // setNotification("DEVELOPMENT MODE: Using dummy config. Login buttons are active but will fail unless a valid Firebase API Key is loaded.");
                
                authEnabled = false; 
            }

            // 3. Initialize Firebase using the chosen configuration
            const app = initializeApp(config);
            const authInstance = getAuth(app);
            setAuth(authInstance); // Set auth instance to state, enabling the UI

            // 4. Attempt initial sign-in (anonymous or custom token)
            const signIn = async (auth) => {
                if (!authEnabled) return; // Skip sign-in if we're using the dummy config

                try {
                    if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                        await signInWithCustomToken(auth, __initial_auth_token);
                        console.log("Firebase signed in with custom token.");
                    } else {
                        await signInAnonymously(auth);
                        console.log("Firebase signed in anonymously.");
                    }
                } catch (error) {
                    console.error("Firebase sign-in error:", error);
                    setError("Could not connect to authentication service. Check your Firebase config and rules.");
                }
            };

            signIn(authInstance);

        } catch (e) {
            // This critical catch block should now only be hit if the SDK itself fails to load,
            // not for JSON parsing errors.
            console.error("Critical Error initializing Firebase SDK:", e);
            setError("Application failed to load due to a critical configuration error.");
            setAuth(false); // Disable everything if initialization truly fails
        }
    }, []); // Empty dependency array ensures this runs once on mount

    // Clear messages when switching views
    const toggleView = () => {
        setIsRegisterView(!isRegisterView);
        setError('');
        // Do not clear 'notification' as it holds the persistent dummy config message
        setPassword(''); // Clear password on view toggle
    };

    const handleEmailPasswordSubmit = (e) => {
        e.preventDefault();
        if (isRegisterView) {
            handleRegister();
        } else {
            handleLogin();
        }
    };

    const handleLogin = async () => {
        if (!auth) return; // Wait for auth to be initialized
        setError('');
        // Do not clear notification
        setIsLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('User logged in:', userCredential.user);
            
            if (onLoginSuccess) {
                onLoginSuccess(userCredential.user);
            }
        } catch (error) {
            console.error('Login error:', error);
            handleAuthError(error); // Use a common error handler
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!auth) return; // Wait for auth to be initialized
        setError('');
        // Do not clear notification
        setIsLoading(true);

        // Simple password validation (example)
        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            setIsLoading(false);
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log('User registered:', userCredential.user);
            setNotification('Account created successfully! Signing in...');
            
            // Automatically log in the user after successful registration
            if (onLoginSuccess) {
                onLoginSuccess(userCredential.user);
            }
        } catch (error) {
            console.error('Registration error:', error);
            handleAuthError(error); // Use a common error handler
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!auth) return; // Wait for auth to be initialized
        if (!email) {
            setError('Please enter your email address to reset your password.');
            // Do not clear notification
            return;
        }

        setError('');
        // Do not clear notification
        setIsLoading(true);

        try {
            await sendPasswordResetEmail(auth, email);
            setNotification(`Password reset email sent to ${email}. Check your inbox (and spam folder).`);
        } catch (error) {
            console.error('Password reset error:', error);
            handleAuthError(error); // Use a common error handler
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        if (!auth) return; // Wait for auth to be initialized
        setError('');
        // Do not clear notification
        setIsLoading(true);

        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            console.log('User logged in with Google:', result.user);
            
            if (onLoginSuccess) {
                onLoginSuccess(result.user);
            }
        } catch (error) {
            console.error('Google sign-in error:', error);
            handleAuthError(error); // Use a common error handler
        } finally {
            setIsLoading(false);
        }
    };

    // A centralized function to handle common auth errors
    const handleAuthError = (error) => {
        // First, check if the error is due to using the DUMMY config
        if (error.code === 'auth/invalid-api-key' || error.code === 'auth/network-request-failed' || error.message.includes('A network error')) {
            if (notification.includes("DEVELOPMENT MODE")) {
                setError('Connection failed. This is expected in DEVELOPMENT MODE. Provide real config to authenticate.');
                return;
            }
        }

        switch (error.code) {
            case 'auth/invalid-email':
                setError('Invalid email address format.');
                break;
            case 'auth/user-disabled':
                setError('This account has been disabled.');
                break;
            case 'auth/user-not-found':
                setError('No account found with this email.');
                break;
            case 'auth/wrong-password':
                setError('Incorrect password.');
                break;
            case 'auth/invalid-credential':
                 setError('Invalid email or password.');
                 break;
            case 'auth/email-already-in-use':
                setError('This email is already registered. Please sign in or use a different email.');
                break;
            case 'auth/popup-closed-by-user':
                setError('Sign-in popup was closed. Please try again.');
                break;
            case 'auth/popup-blocked':
                setError('Popup was blocked by browser. Please allow popups and try again.');
                break;
            case 'auth/cancelled-popup-request':
                // User cancelled, no need to show error
                break;
            case 'auth/account-exists-with-different-credential':
                setError('An account already exists with this email using a different sign-in method.');
                break;
            default:
                setError('An error occurred. Please try again.');
        }
    };


    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-900 flex items-center justify-center px-4 py-8">
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -inset-10 opacity-20">
                    <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
                    <div className="absolute top-3/4 right-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
                    <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-500"></div>
                </div>
            </div>

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-md">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
                    {/* Logo */}
                    <div className="flex justify-center mb-6">
                        <img src={BBA_LOGO} alt="BBA Logo" className="w-40 h-30 rounded-full" />
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl font-bold text-white text-center mb-2">
                        {isRegisterView ? 'Create Account' : 'Welcome Back'}
                    </h1>
                    <p className="text-gray-300 text-center mb-8">
                        {isRegisterView 
                            ? 'Sign up to get started' 
                            : 'Sign in to access BBA Payroll Calculator'
                        }
                    </p>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start">
                            <AlertCircle className="w-5 h-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" />
                            <p className="text-red-300 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Notification Message */}
                    {notification && (
                        <div className={`mb-6 p-4 border rounded-lg flex items-start ${notification.includes("DEVELOPMENT MODE") ? 'bg-yellow-500/20 border-yellow-500/50' : 'bg-blue-500/20 border-blue-500/50'}`}>
                            <HelpCircle className={`w-5 h-5 mr-3 flex-shrink-0 mt-0.5 ${notification.includes("DEVELOPMENT MODE") ? 'text-yellow-400' : 'text-blue-300'}`} />
                            <p className={`text-sm ${notification.includes("DEVELOPMENT MODE") ? 'text-yellow-300' : 'text-blue-200'}`}>{notification}</p>
                        </div>
                    )}

                    {/* Google Sign-In Button (Hide in Register view? or allow Google sign up) */}
                    {/* For simplicity, we'll show it in both views */}
                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={isLoading || !auth} // Disable if auth is not ready
                        className="w-full flex items-center justify-center px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mb-6"
                    >
                        <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        {isLoading ? 'Processing...' : `Sign ${isRegisterView ? 'up' : 'in'} with Google`}
                    </button>

                    {/* Divider */}
                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/20"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-slate-900/50 text-gray-400">Or continue with email</span>
                        </div>
                    </div>

                    {/* Login/Register Form */}
                    <form onSubmit={handleEmailPasswordSubmit} className="space-y-6">
                        {/* Email Input */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={!auth} // Disable if auth is not ready
                                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    placeholder="Enter your email"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={!auth} // Disable if auth is not ready
                                    className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors duration-200"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Forgot Password Link - Only show in Login view */}
                        {!isRegisterView && (
                            <div className="text-right">
                                <button
                                    type="button"
                                    onClick={handlePasswordReset}
                                    disabled={isLoading || !auth} // Disable if auth is not ready
                                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200 disabled:opacity-50"
                                >
                                    Forgot Password?
                                </button>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading || !auth} // Disable if auth is not ready
                            className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-500 text-white rounded-lg hover:from-blue-500 hover:to-purple-400 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    {isRegisterView ? (
                                        <UserPlus className="w-5 h-5 mr-2" />
                                    ) : (
                                        <LogIn className="w-5 h-5 mr-2" />
                                    )}
                                    {isRegisterView ? 'Sign Up' : 'Sign In'}
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer Toggle */}
                    <p className="mt-8 text-center text-sm text-gray-400">
                        {isRegisterView
                            ? 'Already have an account? '
                            : "Don't have an account? "}
                        <button
                            type="button"
                            onClick={toggleView}
                            disabled={isLoading || !auth} // Disable if auth is not ready
                            className="font-medium text-blue-400 hover:text-blue-300 transition-colors duration-200 disabled:opacity-50"
                        >
                            {isRegisterView ? 'Sign In' : 'Sign Up'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
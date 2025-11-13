// src/App.js
import React, { useState, useEffect } from 'react';
import { LogOut, RefreshCw } from 'lucide-react';
import LoginPage from './components/LoginPage';
import DriverPayCalculator from './components/DriverPayCalculator';
import AdminUserSelector from './components/AdminUserSelector';
import AdminDebugPanel from './components/AdminDebugPanel';

// Import Firebase Auth
import { auth } from './firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { isCurrentUserAdmin } from './utils/adminConfig';

function App() {
    const [user, setUser] = useState(null);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [viewingUserId, setViewingUserId] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);

    // Listen for authentication state changes
    useEffect(() => {
        console.log('🔄 Setting up auth listener...');
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            console.log('👤 Auth state changed:', currentUser?.email || 'No user');
            setUser(currentUser);
            setIsCheckingAuth(false);
            
            if (currentUser) {
                console.log('✅ User is signed in:', currentUser.email);
                
                // Set viewing user ID to current user by default
                setViewingUserId(currentUser.uid);
                
                // Check admin status
                setTimeout(() => {
                    const adminStatus = isCurrentUserAdmin(auth);
                    console.log('👮 Admin check result:', adminStatus, 'for', currentUser.email);
                    setIsAdmin(adminStatus);
                }, 100);
            } else {
                console.log('❌ User is signed out');
                setViewingUserId(null);
                setIsAdmin(false);
            }
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            console.log('👋 User signed out successfully');
        } catch (error) {
            console.error('❌ Error signing out:', error);
            alert('Failed to sign out. Please try again.');
        }
    };

    const handleUserSelect = (selectedUserId) => {
        console.log('🔀 Switching view to user:', selectedUserId);
        setViewingUserId(selectedUserId);
    };

    // Show loading screen while checking authentication
    if (isCheckingAuth) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-900 text-white flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-400" />
                    <p className="text-xl">Loading...</p>
                </div>
            </div>
        );
    }

    // Show login page if not authenticated
    if (!user) {
        return <LoginPage onLoginSuccess={setUser} />;
    }

    // Show main app if authenticated
    return (
        <div className="relative min-h-screen bg-gradient-to-br from-slate-900 to-slate-900">
            {/* Logout Button - Fixed in top right */}
            <div className="fixed top-4 right-4 z-50">
                <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-2 shadow-lg border border-white/10">
                    <div className="text-xs text-gray-300 mb-1 px-2">
                        Logged in as: <span className="font-semibold text-white">{user.email}</span>
                        {isAdmin && (
                            <span className="ml-2 px-2 py-0.5 bg-orange-600 text-white text-xs rounded-full">
                                ADMIN
                            </span>
                        )}
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full inline-flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                    </button>
                </div>
            </div>
                        <div><AdminDebugPanel/><p>Checker</p></div>
            <div className="container mx-auto px-4 py-8 pt-20">
                {/* Admin Panel Section */}
                {isAdmin && (
                    <div className="mb-8">
                        <AdminUserSelector 
                            onUserSelect={handleUserSelect}
                            currentViewingUserId={viewingUserId}
                        />
                    </div>
                )}

                {/* Main Calculator Component */}
                <DriverPayCalculator viewingUserId={viewingUserId} />
            </div>
        </div>
    );
}

export default App;
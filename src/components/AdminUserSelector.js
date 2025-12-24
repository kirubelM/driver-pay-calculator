// src/components/AdminUserSelector.js
import React, { useState, useEffect } from 'react';
import { Shield, Users, Search, XCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { db, auth } from '../firebaseConfig';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { isCurrentUserAdmin } from '../utils/adminConfig';

const AdminUserSelector = ({ onUserSelect, currentViewingUserId }) => {
    const [allUsers, setAllUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [error, setError] = useState(null);

    // Check if current user is admin
    useEffect(() => {
        console.log('🔍 AdminUserSelector mounted');
        console.log('   Current user email:', auth.currentUser?.email);
        
        const adminStatus = isCurrentUserAdmin(auth);
        console.log('   Admin status:', adminStatus);
        setIsAdmin(adminStatus);
        
        if (adminStatus) {
            console.log('   ✅ User is admin, fetching users...');
            fetchAllUsers();
        } else {
            console.log('   ❌ User is NOT admin, hiding panel');
        }
    }, []);

    const fetchAllUsers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            console.log('🔍 Starting to fetch all users...');
            
            // Get all user documents from the users collection
            const usersSnapshot = await getDocs(collection(db, 'users'));
            console.log('📊 Found users count:', usersSnapshot.docs.length);
            
            const usersList = [];

            for (const userDoc of usersSnapshot.docs) {
                const userId = userDoc.id;
                console.log('👤 Processing user:', userId);
                
                try {
                    // Try to get user's current data to find their email
                    const currentDataDocRef = doc(db, 'users', userId, 'payroll', 'currentData');
                    const currentDataSnap = await getDoc(currentDataDocRef);
                    
                    let userEmail = 'Unknown';
                    
                    if (currentDataSnap.exists()) {
                        const data = currentDataSnap.data();
                        userEmail = data.userEmail || 'No email found';
                        console.log('✅ Found email for', userId, ':', userEmail);
                    } else {
                        console.log('⚠️ No currentData found for', userId);
                        // If no currentData, try to get from payrollHistory
                        const historyRef = collection(db, 'users', userId, 'payrollHistory');
                        const historySnapshot = await getDocs(historyRef);
                        
                        if (!historySnapshot.empty) {
                            const firstHistory = historySnapshot.docs[0].data();
                            userEmail = firstHistory.userEmail || userId.substring(0, 8) + '...';
                            console.log('📜 Found email in history:', userEmail);
                        } else {
                            userEmail = userId.substring(0, 8) + '...';
                            console.log('❌ No data found, using ID:', userEmail);
                        }
                    }

                    usersList.push({
                        userId: userId,
                        email: userEmail,
                        displayName: userEmail
                    });
                } catch (userError) {
                    console.error('Error processing user', userId, ':', userError);
                    // Add user anyway with limited info
                    usersList.push({
                        userId: userId,
                        email: userId.substring(0, 8) + '...',
                        displayName: userId.substring(0, 8) + '...'
                    });
                }
            }

            console.log('✅ Final users list:', usersList);
            setAllUsers(usersList);
            
            if (usersList.length === 0) {
                setError('No users found in the database. Users will appear here after they create their first payroll.');
            }
        } catch (error) {
            console.error('❌ Error fetching users:', error);
            setError(`Failed to load users list: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUserSelection = (userId, email) => {
        console.log('🔀 User selection clicked:', userId, email);
        if (window.confirm(`Switch to viewing ${email}'s payroll data?`)) {
            console.log('✅ User confirmed switch to:', userId);
            onUserSelect(userId);
        } else {
            console.log('❌ User cancelled switch');
        }
    };

    const handleViewAsCurrentUser = () => {
        console.log('🔙 Returning to own data');
        if (window.confirm('Return to viewing your own payroll data?')) {
            onUserSelect(auth.currentUser.uid);
        }
    };

    const filteredUsers = allUsers.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.userId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Don't render if not admin
    if (!isAdmin) {
        console.log('🚫 Admin panel NOT rendering - isAdmin is false');
        return null;
    }

    console.log('✅ Admin panel IS rendering - showing UI');

    return (
        <div className="bg-gradient-to-r from-orange-900/40 to-red-900/40 backdrop-blur-lg rounded-2xl p-6 border-2 border-orange-500/50 shadow-2xl">
            <div className="flex items-center mb-4">
                <Shield className="w-6 h-6 text-orange-400 mr-3" />
                <h2 className="text-2xl font-bold text-white">Admin Panel - View As User</h2>
                <button
                    onClick={fetchAllUsers}
                    disabled={isLoading}
                    className="ml-auto px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm transition-all duration-200 disabled:opacity-50 flex items-center"
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh Users
                </button>
            </div>

            {/* Current viewing status */}
            {currentViewingUserId !== auth.currentUser.uid && (
                <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg flex items-center justify-between">
                    <div className="flex items-center">
                        <Shield className="w-5 h-5 text-yellow-400 mr-2" />
                        <span className="text-yellow-200 text-sm">
                            Currently viewing another user's data
                        </span>
                    </div>
                    <button
                        onClick={handleViewAsCurrentUser}
                        className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-all duration-200"
                    >
                        Return to My Data
                    </button>
                </div>
            )}

            {/* Zero Users Warning */}
            {allUsers.length === 0 && !isLoading && (
                <div className="mb-4 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                    <div className="flex items-start mb-2">
                        <AlertCircle className="w-5 h-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-yellow-200 font-semibold mb-1">⚠️ No Users Found</p>
                            <p className="text-yellow-200 text-sm mb-2">This usually means Firestore security rules are blocking admin access.</p>
                        </div>
                    </div>
                    <div className="bg-black/30 p-3 rounded text-xs text-yellow-100">
                        <p className="font-semibold mb-1">Quick Fix:</p>
                        <ol className="list-decimal list-inside space-y-1">
                            <li>Go to Firebase Console → Firestore Database → Rules</li>
                            <li>Add admin email check to your rules (see debug panel below)</li>
                            <li>Click "Publish" and wait 30 seconds</li>
                            <li>Refresh this page</li>
                        </ol>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-400 mr-2 flex-shrink-0" />
                    <p className="text-red-300 text-sm">{error}</p>
                </div>
            )}

            {/* Search */}
            <div className="mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by email or user ID..."
                        className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                            <XCircle className="w-5 h-5 text-gray-400 hover:text-white" />
                        </button>
                    )}
                </div>
            </div>

            {/* Users List */}
            {isLoading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mx-auto"></div>
                    <p className="text-gray-300 mt-2">Loading users...</p>
                </div>
            ) : (
                <div className="max-h-64 overflow-y-auto space-y-2">
                    {filteredUsers.length === 0 ? (
                        <p className="text-gray-400 text-center py-4">
                            {allUsers.length === 0 ? 'No users found. Click "Refresh Users" to try again.' : 'No users match your search.'}
                        </p>
                    ) : (
                        filteredUsers.map((user) => (
                            <button
                                key={user.userId}
                                onClick={() => handleUserSelection(user.userId, user.email)}
                                className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                                    currentViewingUserId === user.userId
                                        ? 'bg-orange-600/50 border-2 border-orange-400'
                                        : 'bg-white/5 hover:bg-white/10 border border-white/10'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <Users className="w-5 h-5 text-orange-400" />
                                        <div>
                                            <p className="text-white font-medium">{user.email}</p>
                                            <p className="text-gray-400 text-xs">ID: {user.userId.substring(0, 12)}...</p>
                                        </div>
                                    </div>
                                    {currentViewingUserId === user.userId && (
                                        <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full">
                                            Viewing
                                        </span>
                                    )}
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}

            <div className="mt-4 pt-4 border-t border-white/20">
                <p className="text-xs text-gray-400 text-center">
                    ⚠️ Admin Mode: You have full access to view and modify other users' payroll data
                </p>
            </div>
        </div>
    );
};

export default AdminUserSelector;
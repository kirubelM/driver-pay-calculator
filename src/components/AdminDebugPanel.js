// src/components/AdminDebugPanel.js
import React, { useState } from 'react';
import { AlertCircle, CheckCircle, XCircle, Database, RefreshCw } from 'lucide-react';
import { db, auth } from '../firebaseConfig';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

const AdminDebugPanel = () => {
    const [debugResults, setDebugResults] = useState([]);
    const [isRunning, setIsRunning] = useState(false);

    const addDebugResult = (test, status, message, data = null) => {
        setDebugResults(prev => [...prev, { test, status, message, data, time: new Date().toLocaleTimeString() }]);
    };

    const runDiagnostics = async () => {
        setDebugResults([]);
        setIsRunning(true);

        try {
            // Test 1: Check authentication
            addDebugResult('Authentication', 'info', 'Checking current user...');
            const user = auth.currentUser;
            
            if (!user) {
                addDebugResult('Authentication', 'error', 'No user logged in!');
                setIsRunning(false);
                return;
            }
            
            addDebugResult('Authentication', 'success', `Logged in as: ${user.email}`, { uid: user.uid });

            // Test 2: Check if we can access Firestore at all
            addDebugResult('Firestore Access', 'info', 'Testing basic Firestore access...');
            try {
                const testRef = collection(db, 'users');
                addDebugResult('Firestore Access', 'success', 'Can create Firestore reference');
            } catch (err) {
                addDebugResult('Firestore Access', 'error', `Cannot access Firestore: ${err.message}`);
                setIsRunning(false);
                return;
            }

            // Test 3: Try to list all users
            addDebugResult('List Users', 'info', 'Attempting to list all users...');
            try {
                const usersSnapshot = await getDocs(collection(db, 'users'));
                addDebugResult('List Users', 'success', `Found ${usersSnapshot.docs.length} user documents`, {
                    count: usersSnapshot.docs.length,
                    userIds: usersSnapshot.docs.map(doc => doc.id)
                });

                // Test 4: Check each user's data structure
                for (const userDoc of usersSnapshot.docs) {
                    const userId = userDoc.id;
                    addDebugResult(`User: ${userId.substring(0, 8)}...`, 'info', 'Checking user data...');

                    try {
                        // Check if payroll/currentData exists
                        const currentDataRef = doc(db, 'users', userId, 'payroll', 'currentData');
                        const currentDataSnap = await getDoc(currentDataRef);

                        if (currentDataSnap.exists()) {
                            const data = currentDataSnap.data();
                            addDebugResult(
                                `User: ${userId.substring(0, 8)}...`, 
                                'success', 
                                `Has currentData with email: ${data.userEmail || 'No email'}`,
                                { hasEmail: !!data.userEmail, email: data.userEmail }
                            );
                        } else {
                            addDebugResult(
                                `User: ${userId.substring(0, 8)}...`, 
                                'warning', 
                                'No currentData found, checking history...'
                            );

                            // Check payrollHistory
                            const historyRef = collection(db, 'users', userId, 'payrollHistory');
                            const historySnap = await getDocs(historyRef);

                            if (!historySnap.empty) {
                                const firstDoc = historySnap.docs[0].data();
                                addDebugResult(
                                    `User: ${userId.substring(0, 8)}...`, 
                                    'warning', 
                                    `Found email in history: ${firstDoc.userEmail || 'No email'}`,
                                    { source: 'history', email: firstDoc.userEmail }
                                );
                            } else {
                                addDebugResult(
                                    `User: ${userId.substring(0, 8)}...`, 
                                    'warning', 
                                    'No data found anywhere for this user'
                                );
                            }
                        }
                    } catch (userErr) {
                        addDebugResult(
                            `User: ${userId.substring(0, 8)}...`, 
                            'error', 
                            `Error accessing user data: ${userErr.message}`,
                            { code: userErr.code }
                        );
                    }
                }

            } catch (listErr) {
                addDebugResult('List Users', 'error', `Failed to list users: ${listErr.message}`, {
                    code: listErr.code,
                    message: listErr.message
                });
            }

            // Test 5: Check Firestore rules
            addDebugResult('Firestore Rules', 'info', 'Checking if rules might be blocking access...');
            addDebugResult('Firestore Rules', 'info', 'Admin users need special rules to access all user data', {
                currentRule: 'Standard rule: allow if request.auth.uid == userId',
                neededRule: 'Admin rule: allow if request.auth.token.email in ["admin@bba.com", ...]',
                solution: 'See recommended rules below'
            });

        } catch (err) {
            addDebugResult('General Error', 'error', `Unexpected error: ${err.message}`, {
                stack: err.stack
            });
        } finally {
            setIsRunning(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'success':
                return <CheckCircle className="w-5 h-5 text-green-400" />;
            case 'error':
                return <XCircle className="w-5 h-5 text-red-400" />;
            case 'warning':
                return <AlertCircle className="w-5 h-5 text-yellow-400" />;
            default:
                return <Database className="w-5 h-5 text-blue-400" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'success':
                return 'bg-green-500/20 border-green-500/50 text-green-300';
            case 'error':
                return 'bg-red-500/20 border-red-500/50 text-red-300';
            case 'warning':
                return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300';
            default:
                return 'bg-blue-500/20 border-blue-500/50 text-blue-300';
        }
    };

    return (
        <div className="mb-8 bg-purple-900/40 backdrop-blur-lg rounded-2xl p-6 border-2 border-purple-500/50 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <Database className="w-6 h-6 text-purple-400 mr-3" />
                    <h2 className="text-2xl font-bold text-white">Admin Diagnostics Panel</h2>
                </div>
                <button
                    onClick={runDiagnostics}
                    disabled={isRunning}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-all duration-200 disabled:opacity-50 flex items-center"
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
                    {isRunning ? 'Running...' : 'Run Diagnostics'}
                </button>
            </div>

            <p className="text-gray-300 text-sm mb-4">
                Click "Run Diagnostics" to check why users aren't loading. This will test authentication, Firestore access, and data structure.
            </p>

            {debugResults.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {debugResults.map((result, index) => (
                        <div
                            key={index}
                            className={`p-3 rounded-lg border ${getStatusColor(result.status)}`}
                        >
                            <div className="flex items-start">
                                <div className="mr-3 mt-0.5 flex-shrink-0">
                                    {getStatusIcon(result.status)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-semibold text-sm">{result.test}</span>
                                        <span className="text-xs opacity-75">{result.time}</span>
                                    </div>
                                    <div className="text-sm break-words">{result.message}</div>
                                    {result.data && (
                                        <details className="mt-2">
                                            <summary className="cursor-pointer text-xs opacity-75 hover:opacity-100">
                                                View Details
                                            </summary>
                                            <pre className="mt-2 text-xs bg-black/30 p-2 rounded overflow-x-auto">
                                                {JSON.stringify(result.data, null, 2)}
                                            </pre>
                                        </details>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-6 p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                <h3 className="font-semibold text-blue-300 mb-2">📋 Required Firestore Rules for Admin Access:</h3>
                <pre className="text-xs bg-black/30 p-3 rounded overflow-x-auto text-blue-200">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null && 
             request.auth.token.email in [
               'admin@bba.com',
               'manager@bba.com', 
               'zewdukirubel7@gmail.com'
             ];
    }
    
    // User data access rules
    match /users/{userId}/{document=**} {
      // Allow users to access their own data
      allow read, write: if request.auth != null 
                         && request.auth.uid == userId;
      
      // Allow admins to access all user data
      allow read, write: if isAdmin();
    }
  }
}`}
                </pre>
                <p className="text-xs text-blue-300 mt-2">
                    ⚠️ Go to Firebase Console → Firestore Database → Rules and paste these rules
                </p>
            </div>
        </div>
    );
};

export default AdminDebugPanel;
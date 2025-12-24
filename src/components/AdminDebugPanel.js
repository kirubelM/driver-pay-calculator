// src/components/AdminDebugPanel.js - SIMPLIFIED VERSION
import React, { useState } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

const AdminDebugPanel = () => {
    const [debugResults, setDebugResults] = useState([]);
    const [isRunning, setIsRunning] = useState(false);

    const runDiagnostics = async () => {
        console.log('🚀 RUN DIAGNOSTICS BUTTON CLICKED!');
        
        setDebugResults([]);
        setIsRunning(true);

        const results = [];

        try {
            // Test 1: Check authentication and token
            results.push('✅ Test 1: Checking authentication and token...');
            const user = auth.currentUser;
            
            if (!user) {
                results.push('❌ ERROR: No user logged in!');
                setDebugResults(results);
                setIsRunning(false);
                return;
            }
            
            results.push(`✅ Logged in as: ${user.email}`);
            results.push(`✅ UID: ${user.uid}`);
            
            // Get the ID token to check claims
            try {
                const token = await user.getIdToken();
                const tokenResult = await user.getIdTokenResult();
                results.push(`✅ Token retrieved successfully`);
                results.push(`   Token claims email: ${tokenResult.claims.email}`);
                results.push(`   Token issued at: ${new Date(tokenResult.issuedAtTime).toLocaleString()}`);
            } catch (tokenErr) {
                results.push(`⚠️ Could not get token: ${tokenErr.message}`);
            }

            // Test 2: Check if YOUR user document exists
            results.push('\n📋 Test 2: Checking if YOUR user document exists...');
            try {
                const yourDocRef = doc(db, 'users', user.uid, 'payroll', 'currentData');
                const yourDocSnap = await getDoc(yourDocRef);
                
                if (yourDocSnap.exists()) {
                    results.push(`✅ YOUR user document EXISTS!`);
                    results.push(`✅ Path: users/${user.uid}/payroll/currentData`);
                } else {
                    results.push(`❌ YOUR user document DOES NOT EXIST yet!`);
                    results.push(`❌ You need to use the calculator first to create it`);
                }
            } catch (err) {
                results.push(`❌ Error checking your document: ${err.message}`);
                results.push(`❌ Error code: ${err.code}`);
            }

            // Test 3: Try to list all users AND test direct access
            results.push('\n📋 Test 3: Attempting to list all USER ID documents...');
            results.push('   This queries: collection(db, "users")');
            
            try {
                console.log('🔍 About to call getDocs...');
                const usersSnapshot = await getDocs(collection(db, 'users'));
                console.log('📦 getDocs returned:', usersSnapshot);
                console.log('📦 Docs array:', usersSnapshot.docs);
                console.log('📦 Docs length:', usersSnapshot.docs.length);
                
                results.push(`📊 RESULT: Found ${usersSnapshot.docs.length} user ID documents`);
                
                // NEW: Try to directly access the known user IDs
                results.push('\n🔍 Test 3b: Trying to directly access known user IDs...');
                const knownUserIds = [
                    'kbueGiSbmdOoO8XCpGoR2NzfQ2x2',
                    'qb7DsdHAGoYIszRakb0YHALUesj2',
                    'r2jiorRU8vgj4sHWWpGMXx7AVVZ2',
                    user.uid
                ];
                
                for (const testUserId of knownUserIds) {
                    results.push(`\n   Testing: ${testUserId.substring(0, 12)}...`);
                    try {
                        // Try to get the user document itself
                        const userDocRef = doc(db, 'users', testUserId);
                        const userDocSnap = await getDoc(userDocRef);
                        
                        results.push(`      Root doc exists: ${userDocSnap.exists()}`);
                        
                        if (userDocSnap.exists()) {
                            results.push(`      Root doc data: ${JSON.stringify(userDocSnap.data())}`);
                        }
                        
                        // Try to get their payroll data
                        const payrollRef = doc(db, 'users', testUserId, 'payroll', 'currentData');
                        const payrollSnap = await getDoc(payrollRef);
                        
                        if (payrollSnap.exists()) {
                            const data = payrollSnap.data();
                            results.push(`      ✅ Payroll data exists`);
                            results.push(`      ✅ Email: ${data.userEmail}`);
                        } else {
                            results.push(`      ⚠️ No payroll data`);
                        }
                    } catch (err) {
                        results.push(`      ❌ Error: ${err.code} - ${err.message}`);
                    }
                }
                
                if (usersSnapshot.docs.length === 0) {
                    results.push('\n❌ WARNING: getDocs returns 0 but direct access works!');
                    results.push('❌ This means user documents have NO ROOT-LEVEL FIELDS');
                    results.push('❌ Firestore only returns docs with fields, not empty containers');
                    results.push('');
                    results.push('🔴 ROOT CAUSE FOUND:');
                    results.push('   Your user documents are EMPTY at the root level');
                    results.push('   They only have subcollections (payroll, payrollHistory)');
                    results.push('   Firestore queries skip empty documents!');
                    results.push('');
                    results.push('💡 SOLUTION:');
                    results.push('   Need to add a field to each user document root');
                    results.push('   OR query the subcollection directly');
                    results.push('   OR use collectionGroup queries');
                } else {
                    results.push('✅ SUCCESS: User IDs found! Checking their payroll data...');
                    
                    for (const userDoc of usersSnapshot.docs) {
                        const userId = userDoc.id;
                        const isYou = userId === user.uid;
                        results.push(`\n👤 User ID: ${userId}${isYou ? ' (YOU!)' : ''}`);
                        
                        try {
                            const currentDataRef = doc(db, 'users', userId, 'payroll', 'currentData');
                            const currentDataSnap = await getDoc(currentDataRef);
                            
                            if (currentDataSnap.exists()) {
                                const data = currentDataSnap.data();
                                results.push(`   ✅ Has payroll data`);
                                results.push(`   ✅ Email: ${data.userEmail || 'No email'}`);
                                results.push(`   ✅ Last saved: ${data.lastSaved ? new Date(data.lastSaved).toLocaleString() : 'Unknown'}`);
                            } else {
                                results.push(`   ⚠️ User ID exists but no payroll/currentData yet`);
                                results.push(`   💡 This user needs to use the calculator`);
                            }
                        } catch (err) {
                            results.push(`   ❌ Error reading payroll data: ${err.message}`);
                            if (err.code === 'permission-denied') {
                                results.push(`   🔴 PERMISSION DENIED - Rules might not be working`);
                            }
                        }
                    }
                }
            } catch (listErr) {
                console.error('❌ getDocs error:', listErr);
                results.push(`❌ ERROR listing users: ${listErr.message}`);
                results.push(`❌ Error code: ${listErr.code}`);
                
                if (listErr.code === 'permission-denied') {
                    results.push('\n🔴 PERMISSION DENIED!');
                    results.push('🔴 The admin rule is not working');
                    results.push('🔴 Your email in token: ' + user.email);
                    results.push('🔴 Expected in rules: zewdukirubel7@gmail.com');
                }
            }

            // Test 4: Solution
            results.push('\n📋 SOLUTION:');
            results.push('1. LOG OUT completely from the app');
            results.push('2. Wait 30 seconds');
            results.push('3. LOG BACK IN as zewdukirubel7@gmail.com');
            results.push('4. This will refresh your authentication token');
            results.push('5. Then the admin rules should work');
            results.push('');
            results.push('WHY: Firebase tokens are cached');
            results.push('When rules change, you need a fresh token');

        } catch (err) {
            results.push(`❌ UNEXPECTED ERROR: ${err.message}`);
            console.error('Unexpected error:', err);
        } finally {
            setDebugResults(results);
            setIsRunning(false);
            console.log('✅ Diagnostics complete!', results);
        }
    };

    return (
        <div style={{
            backgroundColor: '#6b21a8',
            color: 'white',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '20px',
            border: '3px solid #a855f7',
            position: 'relative',
            zIndex: 1
        }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
                🔍 Admin Diagnostics Panel
            </h2>
            
            <button
                onClick={runDiagnostics}
                disabled={isRunning}
                onMouseEnter={() => console.log('Button hover detected')}
                style={{
                    backgroundColor: isRunning ? '#666' : '#8b5cf6',
                    color: 'white',
                    padding: '10px 20px',
                    fontSize: '16px',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: isRunning ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    marginBottom: '20px'
                }}
            >
                {isRunning ? '⏳ Running...' : '▶️ RUN DIAGNOSTICS'}
            </button>

            {debugResults.length > 0 && (
                <div style={{
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    padding: '15px',
                    borderRadius: '5px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    fontFamily: 'monospace',
                    fontSize: '12px'
                }}>
                    {debugResults.map((result, index) => (
                        <div key={index} style={{ marginBottom: '5px' }}>
                            {result}
                        </div>
                    ))}
                </div>
            )}

            {debugResults.length === 0 && (
                <p style={{ fontSize: '14px', opacity: 0.8 }}>
                    Click "RUN DIAGNOSTICS" to check why users aren't loading
                </p>
            )}
        </div>
    );
};

export default AdminDebugPanel;
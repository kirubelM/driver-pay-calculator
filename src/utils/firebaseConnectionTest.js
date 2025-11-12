// Enhanced debugging component to test Firebase connection
// Add this temporarily to your app to diagnose the issue

import React, { useState } from 'react';
import { db, auth } from '../firebaseConfig';
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

const FirebaseConnectionTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (test, status, message, details = null) => {
    setTestResults(prev => [...prev, { test, status, message, details, timestamp: new Date() }]);
  };

  const runTests = async () => {
    setTestResults([]);
    setIsRunning(true);

    try {
      // Test 1: Check if user is authenticated
      addResult('Authentication', 'info', 'Checking authentication...');
      const user = auth.currentUser;
      
      if (!user) {
        addResult('Authentication', 'error', 'No user is logged in!');
        setIsRunning(false);
        return;
      }
      
      addResult('Authentication', 'success', `Logged in as: ${user.email}`, { uid: user.uid });

      // Test 2: Check Firebase config
      addResult('Firebase Config', 'info', 'Checking Firebase configuration...');
      if (!db) {
        addResult('Firebase Config', 'error', 'Firestore is not initialized!');
        setIsRunning(false);
        return;
      }
      addResult('Firebase Config', 'success', 'Firestore is properly initialized');

      // Test 3: Try to write to Firestore
      addResult('Write Test', 'info', 'Attempting to write test data...');
      const userId = user.uid;
      const testDocRef = doc(db, "users", userId, "test", "connectionTest");
      
      try {
        await setDoc(testDocRef, {
          message: "Connection test successful",
          timestamp: new Date().toISOString(),
          userEmail: user.email
        });
        addResult('Write Test', 'success', 'Successfully wrote to Firestore!');
      } catch (writeError) {
        addResult('Write Test', 'error', `Write failed: ${writeError.message}`, {
          code: writeError.code,
          details: writeError.toString()
        });
        setIsRunning(false);
        return;
      }

      // Test 4: Try to read from Firestore
      addResult('Read Test', 'info', 'Attempting to read test data...');
      try {
        const docSnap = await getDoc(testDocRef);
        if (docSnap.exists()) {
          addResult('Read Test', 'success', 'Successfully read from Firestore!', docSnap.data());
        } else {
          addResult('Read Test', 'warning', 'Document exists but no data found');
        }
      } catch (readError) {
        addResult('Read Test', 'error', `Read failed: ${readError.message}`, {
          code: readError.code
        });
      }

      // Test 5: Try to write to payroll path
      addResult('Payroll Path Test', 'info', 'Testing payroll data path...');
      const payrollDocRef = doc(db, "users", userId, "payroll", "currentData");
      
      try {
        await setDoc(payrollDocRef, {
          test: true,
          timestamp: new Date().toISOString(),
          message: "Payroll path test"
        });
        addResult('Payroll Path Test', 'success', 'Payroll path is writable!');
      } catch (payrollError) {
        addResult('Payroll Path Test', 'error', `Payroll write failed: ${payrollError.message}`, {
          code: payrollError.code,
          path: `users/${userId}/payroll/currentData`
        });
      }

      // Test 6: Check Firestore rules (informational)
      addResult('Security Rules', 'info', 'If tests failed, check your Firestore security rules', {
        requiredRule: `
match /users/{userId}/{document=**} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}`
      });

    } catch (error) {
      addResult('General Error', 'error', `Unexpected error: ${error.message}`, {
        stack: error.stack
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
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
          <h1 className="text-3xl font-bold text-white mb-6">🔥 Firebase Connection Test</h1>
          
          <button
            onClick={runTests}
            disabled={isRunning}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 mb-6"
          >
            {isRunning ? 'Running Tests...' : 'Run Connection Tests'}
          </button>

          {testResults.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-white mb-4">Test Results:</h2>
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
                >
                  <div className="flex items-start">
                    <div className="mr-3 mt-0.5">
                      {getStatusIcon(result.status)}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold mb-1">{result.test}</div>
                      <div className="text-sm">{result.message}</div>
                      {result.details && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs opacity-75 hover:opacity-100">
                            View Details
                          </summary>
                          <pre className="mt-2 text-xs bg-black/30 p-3 rounded overflow-x-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
            <h3 className="font-semibold text-yellow-300 mb-2">Common Issues & Solutions:</h3>
            <ul className="text-sm text-yellow-200 space-y-2">
              <li>✓ <strong>Permission Denied:</strong> Update Firestore Rules (see test results)</li>
              <li>✓ <strong>Not Authenticated:</strong> Make sure you're logged in</li>
              <li>✓ <strong>Network Error:</strong> Check internet connection</li>
              <li>✓ <strong>Invalid Config:</strong> Verify firebaseConfig.js settings</li>
            </ul>
          </div>

          <div className="mt-6 p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
            <h3 className="font-semibold text-blue-300 mb-2">Required Firestore Security Rules:</h3>
            <pre className="text-xs bg-black/30 p-3 rounded overflow-x-auto text-blue-200">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null 
                         && request.auth.uid == userId;
    }
  }
}`}
            </pre>
            <p className="text-xs text-blue-300 mt-2">
              Add this rule in Firebase Console → Firestore Database → Rules
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirebaseConnectionTest;
// src/components/DatabaseDebugPanel.js
import React, { useState } from 'react';
import { Database, Check, X, Info, RefreshCw } from 'lucide-react';
import {
  initializeUserPayrollData,
  checkUserDataExists,
  getUserDatabaseInfo,
  resetUserPayrollData
} from '../utils/firebaseInitializer';

const DatabaseDebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (actionFn, actionName) => {
    setIsLoading(true);
    setResult({ type: 'loading', message: `${actionName}...` });
    
    try {
      const res = await actionFn();
      setResult({
        type: res.success ? 'success' : 'error',
        message: res.message || 'Action completed',
        data: res
      });
    } catch (error) {
      setResult({
        type: 'error',
        message: `Error: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckExists = async () => {
    setIsLoading(true);
    const exists = await checkUserDataExists();
    setResult({
      type: exists ? 'success' : 'info',
      message: exists 
        ? '✅ User data exists in database' 
        : '⚠️ No user data found - needs initialization'
    });
    setIsLoading(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg transition-all duration-300"
        title="Database Debug Panel"
      >
        <Database className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-slate-800 rounded-xl shadow-2xl border border-white/20 p-6 w-96 max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center">
          <Database className="w-5 h-5 mr-2" />
          Database Debug Panel
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleCheckExists}
          disabled={isLoading}
          className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
        >
          <Info className="w-4 h-4 mr-2" />
          Check if Data Exists
        </button>

        <button
          onClick={() => handleAction(initializeUserPayrollData, 'Initializing')}
          disabled={isLoading}
          className="w-full flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
        >
          <Check className="w-4 h-4 mr-2" />
          Initialize User Data
        </button>

        <button
          onClick={() => handleAction(getUserDatabaseInfo, 'Getting Info')}
          disabled={isLoading}
          className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
        >
          <Database className="w-4 h-4 mr-2" />
          Get Database Info
        </button>

        <button
          onClick={() => {
            if (window.confirm('Are you sure? This will reset all current data!')) {
              handleAction(resetUserPayrollData, 'Resetting');
            }
          }}
          disabled={isLoading}
          className="w-full flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reset to Defaults
        </button>
      </div>

      {result && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${
          result.type === 'success' ? 'bg-green-500/20 text-green-300' :
          result.type === 'error' ? 'bg-red-500/20 text-red-300' :
          result.type === 'loading' ? 'bg-blue-500/20 text-blue-300' :
          'bg-gray-500/20 text-gray-300'
        }`}>
          <div className="font-semibold mb-1">{result.message}</div>
          {result.data && result.data.data && (
            <pre className="text-xs mt-2 overflow-x-auto">
              {JSON.stringify(result.data.data, null, 2)}
            </pre>
          )}
          {result.data && result.data.path && (
            <div className="text-xs mt-1 opacity-75">
              Path: {result.data.path}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-xs text-gray-400">
          💡 Use these tools to initialize or debug your Firebase database structure.
          Remove this component in production.
        </p>
      </div>
    </div>
  );
};

export default DatabaseDebugPanel;
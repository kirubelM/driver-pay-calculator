import React, { useState, useEffect } from 'react';
import { Calculator, Users, DollarSign, Calendar, Clock, FileText, Download, Settings, RefreshCw, TrendingUp } from 'lucide-react';
import BBA_LOGO from '../img/bba_logoa.png'; // Adjust the path as necessary

const defaultDriverData = {
  "Adisu J": { dailyRate: 250, hourlyRate: 25, daysWorked: 10, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Barnabas": { dailyRate: 250, hourlyRate: 25, daysWorked: 10, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Birhanu": { dailyRate: 230, hourlyRate: 23, daysWorked: 10, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Daniel": { dailyRate: 250, hourlyRate: 25, daysWorked: 12, hoursWorked: 0, expense1099: 0, comments: "" },
  "Dawit": { dailyRate: 230, hourlyRate: 23, daysWorked: 10, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Ephrem": { dailyRate: 275, hourlyRate: 25, daysWorked: 10, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Eshetu": { dailyRate: 230, hourlyRate: 23, daysWorked: 10, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Eyouel": { dailyRate: 250, hourlyRate: 25, daysWorked: 10, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Feleke": { dailyRate: 275, hourlyRate: 25, daysWorked: 12, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Kaleab": { dailyRate: 312, hourlyRate: 26, daysWorked: 10, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Keun": { dailyRate: 308, hourlyRate: 28, daysWorked: 10, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Kirubel": { dailyRate: 230, hourlyRate: 0, daysWorked: 10, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Mulugeta": { dailyRate: 230, hourlyRate: 25, daysWorked: 10, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Mussie": { dailyRate: 250, hourlyRate: 25, daysWorked: 10, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Semira": { dailyRate: 172.5, hourlyRate: 0, daysWorked: 8, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Tekle": { dailyRate: 324, hourlyRate: 27, daysWorked: 10, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Yared": { dailyRate: 275, hourlyRate: 25, daysWorked: 8, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Yordanos": { dailyRate: 324, hourlyRate: 0, daysWorked: 12, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Zebib": { dailyRate: 230, hourlyRate: 23, daysWorked: 6, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Zekarias": { dailyRate: 275, hourlyRate: 25, daysWorked: 10, hoursWorked: 0, expense1099: 0, comments: "-" }
};

const DriverPayCalculator = () => {
  const [driverData, setDriverData] = useState(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem('driverPayData');
    return saved ? JSON.parse(saved) : defaultDriverData;
  });

  const [showSettings, setShowSettings] = useState(false);
  const [payResults, setPayResults] = useState([]);
  const [totalPay, setTotalPay] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);

  // Save to localStorage whenever driverData changes
  useEffect(() => {
    localStorage.setItem('driverPayData', JSON.stringify(driverData));
  }, [driverData]);

  const calculatePay = (hoursWorked, hourlyRate, daysWorked, dailyRate, expense1099) => {
    const hourlyPay = hoursWorked * hourlyRate;
    const dailyPay = daysWorked * dailyRate;
    const regularPay = hourlyPay + dailyPay;
    const totalPay = regularPay + expense1099;

    return { hourlyPay, dailyPay, regularPay, totalPay, expense1099 };
  };

  const handleDriverDataChange = (driverName, field, value) => {
    setDriverData(prev => ({
      ...prev,
      [driverName]: {
        ...prev[driverName],
        [field]: value
      }
    }));
  };

  const handleRateChange = (driverName, field, value) => {
    setDriverData(prev => ({
      ...prev,
      [driverName]: {
        ...prev[driverName],
        [field]: parseFloat(value) || 0
      }
    }));
  };

  const calculateAllDrivers = () => {
    setIsCalculating(true);

    setTimeout(() => {
      let totalPayAll = 0;
      const results = [];

      Object.entries(driverData).forEach(([driverName, data]) => {
        const { hoursWorked, daysWorked, expense1099, dailyRate, hourlyRate, comments } = data;

        if (hoursWorked < 0 || daysWorked < 0 || expense1099 < 0) return;

        const payData = calculatePay(hoursWorked, hourlyRate, daysWorked, dailyRate, expense1099);
        totalPayAll += payData.totalPay;

        results.push({
          name: driverName,
          ...payData,
          daysWorked,
          hoursWorked,
          dailyRate,
          hourlyRate,
          comments: comments || "No comments"
        });
      });

      setPayResults(results);
      setTotalPay(totalPayAll);
      setIsCalculating(false);
    }, 800);
  };

  const resetToDefaults = () => {
    setDriverData(defaultDriverData);
    setPayResults([]);
    setTotalPay(0);
    localStorage.removeItem('driverPayData');
  };

  const exportToCSV = () => {
    if (payResults.length === 0) return;

    const csvContent = [
      ['Driver', 'Days Worked', 'Daily Rate', 'Daily Pay', 'Hours Worked', 'Hourly Rate', 'Hourly Pay', '1099 Expense', 'Regular Pay', 'Total Pay', 'Comments'],
      ...payResults.map(result => [
        result.name,
        result.daysWorked,
        result.dailyRate,
        result.dailyPay.toFixed(2),
        result.hoursWorked,
        result.hourlyRate,
        result.hourlyPay.toFixed(2),
        result.expense1099.toFixed(2),
        result.regularPay.toFixed(2),
        result.totalPay.toFixed(2),
        result.comments
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'driver_pay_summary.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportData = () => {
    const dataToExport = {
      driverData,
      payResults,
      totalPay,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `driver_pay_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (importedData.driverData) {
          setDriverData(importedData.driverData);
          if (importedData.payResults) {
            setPayResults(importedData.payResults);
            setTotalPay(importedData.totalPay || 0);
          }
        }
      } catch (error) {
        alert('Invalid file format. Please select a valid backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900  to-slate-900">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-500"></div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-6">
          {/* <div className="mb-6"> */}
            <div className="text-2xl font-bold mb-4 text-white "> BBA Pay Calculator</div>
            <div className="flex justify-center ">
              <img src={BBA_LOGO} alt="BBA Logo" className="w-60 h-30 rounded-full mb-6 " />  </div>
            {/* <div className="text-white text-xl ">Calculate and manage driver payments effortlessly</div> */}
          {/* </div> */}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-lg hover:from-slate-600 hover:to-slate-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <Settings className="w-5 h-5 mr-2" />
            Rate Settings
          </button>

          <button
            onClick={calculateAllDrivers}
            disabled={isCalculating}
            className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-500 text-white rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCalculating ? (
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Calculator className="w-5 h-5 mr-2" />
            )}
            {isCalculating ? 'Calculating...' : 'Calculate Pay'}
          </button>

          <button
            onClick={exportData}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-500 hover:to-teal-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <Download className="w-5 h-5 mr-2" />
            Backup Data
          </button>

          <label className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg hover:from-yellow-500 hover:to-orange-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 cursor-pointer">
            <FileText className="w-5 h-5 mr-2" />
            Import Data
            <input
              type="file"
              accept=".json"
              onChange={importData}
              className="hidden"
            />
          </label>

          <button
            onClick={resetToDefaults}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-500 hover:to-pink-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Reset All
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-8 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
            <div className="flex items-center mb-6">
              <Settings className="w-6 h-6 text-blue-400 mr-3" />
              <h2 className="text-2xl font-bold text-white">Driver Rate Settings</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(driverData).map(([driverName, data]) => (
                <div key={driverName} className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300">
                  <h3 className="text-lg font-semibold text-white mb-3">{driverName}</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Daily Rate ($)</label>
                      <input
                        type="number"
                        value={data.dailyRate}
                        onChange={(e) => handleRateChange(driverName, 'dailyRate', e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Hourly Rate ($)</label>
                      <input
                        type="number"
                        value={data.hourlyRate}
                        onChange={(e) => handleRateChange(driverName, 'hourlyRate', e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Driver Data Input */}
        <div className="mb-8 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
          <div className="flex items-center mb-6">
            <Users className="w-6 h-6 text-purple-400 mr-3" />
            <h2 className="text-2xl font-bold text-white">Driver Work Details</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-3 px-4 font-semibold text-gray-300">Driver</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-300">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Days
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-300">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      Hours
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-300">
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" />
                      1099 Expense
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-300">
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-1" />
                      Notes
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(driverData).map(([driverName, data]) => (
                  <tr key={driverName} className="border-b border-white/10 hover:bg-white/5 transition-colors duration-200">
                    <td className="py-3 px-4 font-medium text-white">{driverName}</td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        value={data.daysWorked}
                        onChange={(e) => handleDriverDataChange(driverName, 'daysWorked', parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        value={data.hoursWorked}
                        onChange={(e) => handleDriverDataChange(driverName, 'hoursWorked', parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="0.5"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        value={data.expense1099}
                        onChange={(e) => handleDriverDataChange(driverName, 'expense1099', parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={data.comments}
                        onChange={(e) => handleDriverDataChange(driverName, 'comments', e.target.value)}
                        className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results */}
        {payResults.length > 0 && (
          <div className="space-y-8">
           

            {/* Individual Results */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <FileText className="w-6 h-6 mr-3 text-blue-400" />
                Pay Breakdown
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {payResults.map((result) => (
                  <div key={result.name} className="bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">{result.name}</h3>
                      <div className="text-xl font-bold text-green-400">
                        ${result.totalPay.toFixed(2)}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-300">
                        <span>Daily Pay:</span>
                        <span>${result.dailyPay.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Hourly Pay:</span>
                        <span>${result.hourlyPay.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>1099 Expense:</span>
                        <span>${result.expense1099.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-white/10 pt-2">
                        <div className="flex justify-between font-semibold text-white">
                          <span>Regular Pay:</span>
                          <span>${result.regularPay.toFixed(2)}</span>
                        </div>
                      </div>
                      {result.comments && result.comments !== "-" && (
                        <div className="text-xs text-black-400 mt-3 p-2 bg-white rounded">
                          <b>Notes:</b>            <div className="flex justify-between font-semibold text-white">
                            <span>${result.regularPay.toFixed(2)}</span>
                          </div> {result.comments}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
             {/* Total Summary */}
            {/* <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 backdrop-blur-lg rounded-2xl p-8 border border-green-500/30 shadow-2xl">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mb-4">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Total Payroll</h2>
                <p className="text-5xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                  ${totalPay.toFixed(2)}
                </p>
                <button
                  onClick={exportToCSV}
                  className="mt-6 inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-500 hover:to-blue-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Export to CSV
                </button>
              </div>
            </div> */}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverPayCalculator;
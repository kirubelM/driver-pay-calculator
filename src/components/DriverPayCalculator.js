// src/components/DriverPayCalculator.js
import React, { useState, useEffect, useCallback } from 'react';
import { Calculator, Users, DollarSign, Calendar, Clock, FileText, Download, Settings, RefreshCw, TrendingUp, Save, XCircle } from 'lucide-react'; // Added XCircle for modal close
import BBA_LOGO from '../img/as.png'; // Adjust the path as necessary

// Import Firebase
import {
    db
} from '../firebaseConfig';
import {
    doc,    
    getDoc,
    setDoc,
    collection,
    query,
    getDocs,
    orderBy
} from 'firebase/firestore';

// Import React Datepicker components
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css'; // Don't forget to import the CSS!

const defaultDriverData = {
  "Adisu J": { dailyRate: 200, hourlyRate: 20, daysWorked: 10, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Barnabas": { dailyRate: 220, hourlyRate: 22, daysWorked: 12, hoursWorked: 0, expense1099: 0, comments: "" },
  "Birhanu": { dailyRate: 200, hourlyRate: 20, daysWorked: 10, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Daniel": { dailyRate: 220, hourlyRate: 22, daysWorked: 10, hoursWorked: 0, expense1099: 0, comments: "" },
  "Dawit": { dailyRate: 200, hourlyRate: 20, daysWorked: 10, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Eshetu": { dailyRate: 200, hourlyRate: 20, daysWorked: 10, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Eyouel": { dailyRate: 220, hourlyRate: 22, daysWorked: 10, hoursWorked: 0, expense1099: 0, comments: "-" }, 
  "Kaleab": { dailyRate: 220, hourlyRate: 22, daysWorked: 10, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Kirubel": { dailyRate: 210, hourlyRate: 21, daysWorked: 12, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Mulugeta": { dailyRate: 220, hourlyRate: 22, daysWorked: 10, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Mussie": { dailyRate: 220, hourlyRate: 22, daysWorked: 10, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Semira": { dailyRate: 140, hourlyRate: 20, daysWorked: 8, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Tekle": { dailyRate: 264, hourlyRate: 22, daysWorked: 12, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Yared": { dailyRate: 220, hourlyRate: 20, daysWorked: 8, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Yordanos": { dailyRate: 250, hourlyRate: 0, daysWorked: 12, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Zekarias": { dailyRate: 200, hourlyRate: 20, daysWorked: 10, hoursWorked: 0, expense1099: 0, comments: "-" }
};

const DriverPayCalculator = () => {
    const [driverData, setDriverData] = useState({});
    const [showSettings, setShowSettings] = useState(false);
    const [payResults, setPayResults] = useState([]);
    const [totalPay, setTotalPay] = useState(0);
    const [isCalculating, setIsCalculating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [archivedWeeks, setArchivedWeeks] = useState([]);
    const [selectedArchiveId, setSelectedArchiveId] = useState('');
    const [weeklyNotes, setWeeklyNotes] = useState("");
    const [loadedArchiveDetails, setLoadedArchiveDetails] = useState(null);

    // NEW STATES FOR ARCHIVE MODAL
    const [showArchiveModal, setShowArchiveModal] = useState(false);
    const [payDate, setPayDate] = useState(null); // The specific pay date
    const [periodStartDate, setPeriodStartDate] = useState(null); // Start of the work period
    const [periodEndDate, setPeriodEndDate] = useState(null);     // End of the work period
    const [tempWeeklyNotes, setTempWeeklyNotes] = useState("");   // For notes in modal


    // Function to save current driver data to Firebase (overwrites 'currentData')
    const saveCurrentDataToFirebase = useCallback(async (dataToSave, currentPayResults, currentTotalPay) => {
        try {
            const docRef = doc(db, "payroll", "currentData");
            await setDoc(docRef, {
                driverData: dataToSave,
                payResults: currentPayResults,
                totalPay: currentTotalPay,
                lastSaved: new Date().toISOString()
            });
            console.log("Current driver data saved to Firebase.");
            return true; // Indicate success
        } catch (error) {
            console.error("Error saving current data to Firebase:", error);
            alert("Failed to save current data.");
            return false; // Indicate failure
        }
    }, []);

    // Function to fetch the list of all archived payroll weeks
    const fetchArchivedWeeksList = useCallback(async () => {
        setIsLoading(true);
        try {
            const q = query(collection(db, "payrollHistory"), orderBy("archiveTimestamp", "desc"));
            const querySnapshot = await getDocs(q);
            const weeks = querySnapshot.docs.map(doc => {
                const data = doc.data();
                let displayString = '';
                // if (data.payDate) {
                //     displayString += `Pay Date: ${new Date(data.payDate).toLocaleDateString()}`;
                // }
                if (data.periodStartDate && data.periodEndDate) {
                    displayString += ` Period: ${data.periodStartDate} to ${data.periodEndDate}`;
                } else if (data.archiveTimestamp) {
                    displayString += ` (Archived: ${new Date(data.archiveTimestamp).toLocaleDateString()})`;
                }
                return { 
                    id: doc.id,
                    displayDate: displayString || 'N/A Date',
                    archiveTimestamp: data.archiveTimestamp
                };
            });
            setArchivedWeeks(weeks);
            if (weeks.length > 0 && !selectedArchiveId) {
                setSelectedArchiveId(weeks[0].id);
            }
            console.log("Archived weeks list fetched:", weeks);
        } catch (error) {
            console.error("Error fetching archived weeks list:", error);
            alert("Failed to load list of past payrolls.");
        } finally {
            setIsLoading(false);
        }
    }, [selectedArchiveId]);

    // Function to load a selected archived payroll data
    const loadSelectedArchive = useCallback(async () => {
        if (!selectedArchiveId) {
            alert("Please select a payroll week to load.");
            return;
        }

        setIsLoading(true);
        try {
            const docRef = doc(db, "payrollHistory", selectedArchiveId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                setDriverData(data.driverData || defaultDriverData);
                setPayResults(data.payResults || []);
                setTotalPay(data.totalPay || 0);
                setWeeklyNotes(""); // Clear current weekly notes when loading an archive
                setLoadedArchiveDetails({
                    payDate: data.payDate,
                    periodStartDate: data.periodStartDate,
                    periodEndDate: data.periodEndDate,
                    archiveTimestamp: data.archiveTimestamp,
                    numberOfDrivers: data.numberOfDrivers,
                    totalDailyPay: data.totalDailyPay,
                    totalHourlyPay: data.totalHourlyPay,
                    totalRegularPay: data.totalRegularPay,
                    total1099Expense: data.total1099Expense,
                    weeklyNotes: data.weeklyNotes || "No specific notes for this archived week.",
                });
                alert(`Payroll data for "${selectedArchiveId}" loaded! You can now review it.`);
                console.log("Archived data loaded:", data);
            } else {
                alert("The selected archived payroll was not found.");
                console.log(`No archived document found with ID: ${selectedArchiveId}`);
                setLoadedArchiveDetails(null);
            }
        } catch (error) {
            console.error("Error loading archived data:", error);
            alert("Failed to load archived payroll data.");
        } finally {
            setIsLoading(false);
        }
    }, [selectedArchiveId]);

    const calculatePay = (hoursWorked, hourlyRate, daysWorked, dailyRate, expense1099) => {
        const hWorked = parseFloat(hoursWorked) || 0;
        const hRate = parseFloat(hourlyRate) || 0;
        const dWorked = parseFloat(daysWorked) || 0;
        const dRate = parseFloat(dailyRate) || 0;
        const exp1099 = parseFloat(expense1099) || 0;

        const hourlyPay = hWorked * hRate;
        const dailyPay = dWorked * dRate;
        const regularPay = hourlyPay + dailyPay;
        const totalPay = regularPay + exp1099;

        return { hourlyPay, dailyPay, regularPay, totalPay, expense1099: exp1099 };
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

    // Calculate all drivers' pay and save to Firebase, only when called explicitly
    const calculateAndSaveCurrentPayroll = useCallback(async () => {
        setIsCalculating(true);

        setTimeout(async () => {
            let totalPayAll = 0;
            const results = [];

            Object.entries(driverData).forEach(([driverName, data]) => {
                const { hoursWorked, daysWorked, expense1099, dailyRate, hourlyRate, comments } = data;

                const parsedHoursWorked = parseFloat(hoursWorked) || 0;
                const parsedDaysWorked = parseFloat(daysWorked) || 0;
                const parsedExpense1099 = parseFloat(expense1099) || 0;
                const parsedDailyRate = parseFloat(dailyRate) || 0;
                const parsedHourlyRate = parseFloat(hourlyRate) || 0;

                if (parsedHoursWorked < 0 || parsedDaysWorked < 0 || parsedExpense1099 < 0) {
                    console.warn(`Negative values found for ${driverName}, skipping calculation for this driver.`);
                    return;
                }

                const payData = calculatePay(
                    parsedHoursWorked,
                    parsedHourlyRate,
                    parsedDaysWorked,
                    parsedDailyRate,
                    parsedExpense1099
                );
                totalPayAll += payData.totalPay;

                results.push({
                    name: driverName,
                    hourlyPay: payData.hourlyPay || 0,
                    dailyPay: payData.dailyPay || 0,
                    regularPay: payData.regularPay || 0,
                    totalPay: payData.totalPay || 0,
                    expense1099: payData.expense1099 || 0,
                    daysWorked: parsedDaysWorked,
                    hoursWorked: parsedHoursWorked,
                    dailyRate: parsedDailyRate,
                    hourlyRate: parsedHourlyRate,
                    comments: comments || "-"
                });
            });

            setPayResults(results);
            setTotalPay(totalPayAll);
            setIsCalculating(false);

            // Save the current calculated data to Firebase
            const saveSuccess = await saveCurrentDataToFirebase(driverData, results, totalPayAll);
            if (saveSuccess) {
                alert("Payroll calculated and current data saved!");
            }

        }, 800);
    }, [driverData, saveCurrentDataToFirebase]);

    const resetToDefaults = async () => {
        if (window.confirm("Are you sure you want to reset all data to defaults? This will also clear the current data from Firebase.")) {
            setDriverData(defaultDriverData);
            setPayResults([]);
            setTotalPay(0);
            setWeeklyNotes("");
            setLoadedArchiveDetails(null);
            localStorage.removeItem('driverPayData'); // This line might be vestigial if not using local storage anymore

            try {
                const docRef = doc(db, "payroll", "currentData");
                await setDoc(docRef, { driverData: defaultDriverData, payResults: [], totalPay: 0, lastSaved: new Date().toISOString() });
                console.log("Firebase 'currentData' reset to defaults.");
                alert("All current data reset successfully!");
            } catch (error) {
                console.error("Error resetting Firebase data:", error);
                alert("Failed to reset current data in Firebase.");
            }
        }
    };

    const exportToCSV = () => {
        if (payResults.length === 0) return;

        const csvContent = [
            ['Driver', 'Days Worked', 'Daily Rate', 'Daily Pay', 'Hours Worked', 'Hourly Rate', 'Hourly Pay', '1099 Expense', 'Regular Pay', 'Total Pay', 'Comments'],
            ...payResults.sort((a, b) => a.name.localeCompare(b.name)).map(result => [ // Sorted for CSV export
                result.name,
                result.daysWorked ?? 0,
                result.dailyRate ?? 0,
                (result.dailyPay ?? 0).toFixed(2),
                result.hoursWorked ?? 0,
                result.hourlyRate ?? 0,
                (result.hourlyPay ?? 0).toFixed(2),
                (result.expense1099 ?? 0).toFixed(2),
                (result.regularPay ?? 0).toFixed(2),
                (result.totalPay ?? 0).toFixed(2),
                result.comments || "-"
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
            weeklyNotes,
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
        reader.onload = async (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (importedData.driverData) {
                    setDriverData(importedData.driverData);
                    setPayResults(importedData.payResults || []);
                    setTotalPay(importedData.totalPay || 0);
                    setWeeklyNotes(importedData.weeklyNotes || "");
                    setLoadedArchiveDetails(null);

                    const saveSuccess = await saveCurrentDataToFirebase(
                        importedData.driverData,
                        importedData.payResults || [],
                        importedData.totalPay || 0
                    );
                    if (saveSuccess) {
                        alert("Data imported successfully and saved to Firebase as current data!");
                    }
                } else {
                    alert('Invalid file format: Missing driverData.');
                }
            } catch (error) {
                console.error("Error importing data:", error);
                alert('Invalid file format. Please select a valid backup file.');
            }
        };
        reader.readAsText(file);
    };

    // This function now just opens the modal
    const handleArchiveClick = () => {
        if (payResults.length === 0) {
            alert("Please calculate payroll first before archiving.");
            return;
        }
        setTempWeeklyNotes(weeklyNotes);

        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);

        setPayDate(today);          // Default pay date to today
        setPeriodStartDate(sevenDaysAgo); // Default period start to 7 days ago
        setPeriodEndDate(today);      // Default period end to today

        setShowArchiveModal(true);
    };

    // This function performs the actual archiving after dates are selected
    const finalizeAndArchivePayroll = useCallback(async () => {
        if (!payDate || !periodStartDate || !periodEndDate) {
            alert("Please select a Pay Date, Period Start Date, and Period End Date.");
            return;
        }

        // Validate dates: start date must be before or equal to end date
        if (periodStartDate.getTime() > periodEndDate.getTime()) {
            alert("Period Start Date cannot be after Period End Date.");
            return;
        }

        setIsCalculating(true); // Re-using this state for the archive process
        setShowArchiveModal(false); // Close the modal

        try {
            // Recalculate just before archiving to ensure the latest data is used
            let currentTotalPay = 0;
            const currentPayResults = [];
            let totalDailyPay = 0;
            let totalHourlyPay = 0;
            let totalRegularPayCalculated = 0;
            let total1099Expense = 0;

            Object.entries(driverData).forEach(([driverName, data]) => {
                const { hoursWorked, daysWorked, expense1099, dailyRate, hourlyRate, comments } = data;
                const payData = calculatePay(
                    parseFloat(hoursWorked) || 0,
                    parseFloat(hourlyRate) || 0,
                    parseFloat(daysWorked) || 0,
                    parseFloat(dailyRate) || 0,
                    parseFloat(expense1099) || 0
                );
                currentTotalPay += payData.totalPay;
                totalDailyPay += payData.dailyPay;
                totalHourlyPay += payData.hourlyPay;
                totalRegularPayCalculated += payData.regularPay;
                total1099Expense += payData.expense1099;

                currentPayResults.push({
                    name: driverName,
                    hourlyPay: payData.hourlyPay || 0,
                    dailyPay: payData.dailyPay || 0,
                    regularPay: payData.regularPay || 0,
                    totalPay: payData.totalPay || 0,
                    expense1099: payData.expense1099 || 0,
                    daysWorked: parseFloat(daysWorked) || 0,
                    hoursWorked: parseFloat(hoursWorked) || 0,
                    dailyRate: parseFloat(dailyRate) || 0,
                    hourlyRate: parseFloat(hourlyRate) || 0,
                    comments: comments || "-"
                });
            });

            // Set state for current session for display
            setPayResults(currentPayResults);
            setTotalPay(currentTotalPay);

            const archiveTimestamp = new Date().toISOString();
            const payDateISO = payDate.toISOString().split('T')[0];
            const periodStartDateISO = periodStartDate.toISOString().split('T')[0];
            const periodEndDateISO = periodEndDate.toISOString().split('T')[0];

            // Use the Pay Date as the primary part of the document ID
            const payrollWeekId = `payroll_paydate_${payDateISO}`;

            const numberOfDrivers = Object.keys(driverData).length;

            const historyDocRef = doc(db, "payrollHistory", payrollWeekId);

            await setDoc(historyDocRef, {
                driverData: driverData, // Use the current driverData state
                payResults: currentPayResults, // Use the just calculated pay results
                totalPay: currentTotalPay, // Use the just calculated total pay
                payDate: payDateISO, // Store the specific pay date
                periodStartDate: periodStartDateISO,
                periodEndDate: periodEndDateISO,
                archiveTimestamp: archiveTimestamp,
                numberOfDrivers: numberOfDrivers,
                totalDailyPay: totalDailyPay,
                totalHourlyPay: totalHourlyPay,
                totalRegularPay: totalRegularPayCalculated,
                total1099Expense: total1099Expense,
                weeklyNotes: tempWeeklyNotes, // Use notes from the modal
            });

            console.log(`Current payroll archived as: ${payrollWeekId}`);
            alert(`Payroll successfully archived for Pay Date: ${payDateISO}!`);

            // Reset the "currentData" document in Firebase and in local state
            await saveCurrentDataToFirebase(defaultDriverData, [], 0);
            setDriverData(defaultDriverData);
            setPayResults([]);
            setTotalPay(0);
            setWeeklyNotes(""); // Clear main weekly notes
            setLoadedArchiveDetails(null);
            console.log("Current payroll data reset for next period.");

            // Clear modal specific states
            setPayDate(null);
            setPeriodStartDate(null);
            setPeriodEndDate(null);
            setTempWeeklyNotes("");

            await fetchArchivedWeeksList();

        } catch (error) {
            console.error("Error archiving payroll:", error);
            alert("Failed to archive payroll data.");
        } finally {
            setIsCalculating(false);
        }
    }, [driverData, tempWeeklyNotes, payDate, periodStartDate, periodEndDate, saveCurrentDataToFirebase, fetchArchivedWeeksList]);


    // Initial data load for 'currentData' on component mount
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                const docRef = doc(db, "payroll", "currentData");
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setDriverData(data.driverData || defaultDriverData);
                    setPayResults(data.payResults || []);
                    setTotalPay(data.totalPay || 0);
                    setWeeklyNotes("");
                    console.log("Current driver data loaded from Firebase.");
                } else {
                    console.log("No 'currentData' found, initializing with defaults and saving.");
                    await setDoc(docRef, { driverData: defaultDriverData, payResults: [], totalPay: 0, lastSaved: new Date().toISOString() });
                    setDriverData(defaultDriverData);
                    setPayResults([]);
                    setTotalPay(0);
                }
            } catch (error) {
                console.error("Error loading initial current data:", error);
                alert("Failed to load initial data. Using default data. Please check console.");
                setDriverData(defaultDriverData);
                setPayResults([]);
                setTotalPay(0);
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialData();
        fetchArchivedWeeksList();
    }, [saveCurrentDataToFirebase, fetchArchivedWeeksList]);


    // NEW useEffect: Clear payResults and totalPay when driverData changes
    useEffect(() => {
        // This effect runs whenever driverData state object changes.
        // It visually resets the calculation results, indicating they are stale.
        setPayResults([]);
        setTotalPay(0);
    }, [driverData]); // Dependency on driverData

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-900 text-white flex items-center justify-center">
                <RefreshCw className="w-10 h-10 animate-spin mr-3" />
                <p className="text-xl">Loading data from server...</p>
            </div>
        );
    }

    // Helper function to get sorted driver names
    const getSortedDriverNames = () => {
        return Object.keys(driverData).sort((a, b) => a.localeCompare(b));
    };


    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-900">
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
                    <div className="flex justify-center ">
                        <img src={BBA_LOGO} alt="BBA Logo" className="w-60 h-30 rounded-full " />
                    </div>
                    <div className="text-3xl font-bold mb-4 text-white "> BBA Payroll Calculator</div>
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

                    {/* Calculate Pay button now only calculates and saves when clicked */}
                    <button
                        onClick={calculateAndSaveCurrentPayroll}
                        disabled={isCalculating}
                        className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-500 text-white rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isCalculating ? (
                            <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                        ) : (
                            <Calculator className="w-5 h-5 mr-2" />
                        )}
                        {isCalculating ? 'Calculating...' : 'Calculate & Save Current Pay'}
                    </button>

                    {/* Finalize & Archive Payroll Button - now opens modal */}
                    <button
                        onClick={handleArchiveClick} // This now opens the modal
                        disabled={isCalculating || payResults.length === 0}
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-500 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="w-5 h-5 mr-2" />
                        Finalize & Archive Payroll
                    </button>

                    <button
                        onClick={exportToCSV}
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-500 hover:to-teal-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                        <Download className="w-5 h-5 mr-2" />
                        Export CSV
                    </button>

                    <button
                        onClick={exportData}
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-500 hover:to-blue-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                        <Download className="w-5 h-5 mr-2" />
                        Backup JSON
                    </button>

                    <label className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg hover:from-yellow-500 hover:to-orange-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 cursor-pointer">
                        <FileText className="w-5 h-5 mr-2" />
                        Import JSON
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
                            {getSortedDriverNames().map((driverName) => {
                                const data = driverData[driverName];
                                return (
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
                                            {/* <div>
                                                <label className="block text-sm text-gray-300 mb-1">Hourly Rate ($)</label>
                                                <input
                                                    type="number"
                                                    value={data.hourlyRate}
                                                    onChange={(e) => handleRateChange(driverName, 'hourlyRate', e.target.value)}
                                                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div> */}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Input for Weekly Notes (Still here for initial entry)*/}
                <div className="mb-8 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
                    <div className="flex items-center mb-6">
                        <FileText className="w-6 h-6 text-yellow-400 mr-3" />
                        <h2 className="text-2xl font-bold text-white">Overall Weekly Notes (Current Period)</h2>
                    </div>
                    <textarea
                        value={weeklyNotes}
                        onChange={(e) => setWeeklyNotes(e.target.value)}
                        rows="3"
                        placeholder="Add any general notes for this payroll week (these can be finalized in the archive popup)..."
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    ></textarea>
                </div>

                {/* Driver Data Input */}
                <div className="mb-8 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
                    <div className="flex items-center mb-6">
                        <Users className="w-6 h-6 text-purple-400 mr-3" />
                        <h2 className="text-2xl font-bold text-white">Current Week's Driver Work Details</h2>
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
                                {getSortedDriverNames().map((driverName) => {
                                    const data = driverData[driverName];
                                    return (
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
                                                />
                                            </td>
                                            <td className="py-3 px-4">
                                                <input
                                                    type="number"
                                                    value={data.expense1099}
                                                    onChange={(e) => handleDriverDataChange(driverName, 'expense1099', parseFloat(e.target.value) || 0)}
                                                    className="w-28 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    min="0"
                                                />
                                            </td>
                                            <td className="py-3 px-4">
                                                <input
                                                    type="text"
                                                    value={data.comments}
                                                    onChange={(e) => handleDriverDataChange(driverName, 'comments', e.target.value)}
                                                    className="w-40 px-2 py-1 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Notes..."
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Results - Only show if payResults has data */}
                {payResults.length > 0 && (
                    <div className="space-y-8">
                        {/* Individual Results */}
                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                                <FileText className="w-6 h-6 mr-3 text-blue-400" />
                                Pay Breakdown (Current Week)
                            </h2>

                            <div className="overflow-x-auto mb-6">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/20">
                                            <th className="text-left py-3 px-4 font-semibold text-gray-300">Driver</th>
                                            <th className="text-left py-3 px-4 font-semibold text-gray-300">Daily Pay</th>
                                            <th className="text-left py-3 px-4 font-semibold text-gray-300">Hourly Pay</th>
                                            <th className="text-left py-3 px-4 font-semibold text-gray-300">Regular Pay</th>
                                            <th className="text-left py-3 px-4 font-semibold text-gray-300">1099 Expense</th>
                                            <th className="text-left py-3 px-4 font-semibold text-gray-300">Total Pay</th>
                                            <th className="text-left py-3 px-4 font-semibold text-gray-300">Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payResults.sort((a, b) => a.name.localeCompare(b.name)).map(result => (
                                            <tr key={result.name} className="border-b border-white/10 hover:bg-white/5 transition-colors duration-200">
                                                <td className="py-3 px-4 text-white">{result.name}</td>
                                                <td className="py-3 px-4 text-white">${result.dailyPay.toFixed(2)}</td>
                                                <td className="py-3 px-4 text-white">${result.hourlyPay.toFixed(2)}</td>
                                                <td className="py-3 px-4 text-white">${result.regularPay.toFixed(2)}</td>
                                                <td className="py-3 px-4 text-white">${result.expense1099.toFixed(2)}</td>
                                                <td className="py-3 px-4 font-semibold text-green-400">${result.totalPay.toFixed(2)}</td>
                                                <td className="py-3 px-4 text-gray-400 text-sm">{result.comments}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Overall Total Pay */}
                            <div className="mt-8 text-center text-white bg-blue-700/30 rounded-xl p-4 border border-blue-600/50 shadow-lg">
                                <h2 className="text-3xl font-bold flex items-center justify-center">
                                    <TrendingUp className="w-8 h-8 mr-3 text-blue-400" />
                                    Total Payroll: ${totalPay.toFixed(2)}
                                </h2>
                            </div>
                        </div>
                    </div>
                )}
                {/* Message when results are not displayed */}
                {payResults.length === 0 && (
                    <div className="mt-8 text-center text-gray-400 bg-white/5 p-4 rounded-lg border border-white/10">
                        <p className="text-lg">Enter driver work details and click "Calculate & Save Current Pay" to see results.</p>
                        <p className="text-sm mt-2">Results will clear automatically when driver data is changed.</p>
                    </div>
                )}

                {/* Lookback Section */}
                <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                        <Calendar className="w-6 h-6 mr-3 text-yellow-400" />
                        View Past Payrolls
                    </h2>
                    <div className="flex flex-wrap items-center gap-4">
                        <label htmlFor="archive-select" className="text-gray-300 text-lg mr-2">Select Week:</label>
                        <select
                            id="archive-select"
                            value={selectedArchiveId}
                            onChange={(e) => setSelectedArchiveId(e.target.value)}
className="px-4 py-2 bg-white border border-white/20 rounded-lg text-black focus:text-black focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex-grow"                            disabled={isLoading || archivedWeeks.length === 0}
                        >
                            {archivedWeeks.length === 0 ? (
                                <option value="">No past payrolls available</option>
                            ) : (
                                <>
                                    <option value="">-- Select a Past Week --</option>
                                    {archivedWeeks.map(week => (
                                        <option key={week.id} value={week.id}>
                                            {week.displayDate} ({week.id})
                                        </option>
                                    ))}
                                </>
                            )}
                        </select>
                        <button
                            onClick={loadSelectedArchive}
                            disabled={isLoading || !selectedArchiveId}
                            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-500 hover:to-red-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Download className="w-5 h-5 mr-2" />
                            {isLoading ? 'Loading...' : 'Load Selected Payroll'}
                        </button>
                    </div>
                    {/* Display more details from the loaded archive if available */}
                    {loadedArchiveDetails && (
                        <div className="mt-4 p-4 bg-white/5 rounded-lg text-gray-300 text-sm border border-white/10">
                            <h3 className="text-lg font-semibold text-white mb-2">Archived Payroll Summary:</h3>
                            {loadedArchiveDetails.payDate && <p><strong>Pay Date:</strong> {new Date(loadedArchiveDetails.payDate).toLocaleDateString()}</p>}
                            {loadedArchiveDetails.periodStartDate && loadedArchiveDetails.periodEndDate && (
                                <p><strong>Period:</strong> {loadedArchiveDetails.periodStartDate} to {loadedArchiveDetails.periodEndDate}</p>
                            )}
                            <p><strong>Archived On:</strong> {loadedArchiveDetails.archiveTimestamp ? new Date(loadedArchiveDetails.archiveTimestamp).toLocaleString() : 'N/A'}</p>
                            <p><strong>Total Drivers:</strong> {loadedArchiveDetails.numberOfDrivers}</p>
                            <p><strong>Total Payroll Amount:</strong> ${loadedArchiveDetails.totalPay ? loadedArchiveDetails.totalPay.toFixed(2) : '0.00'}</p>
                            <p><strong>Total Daily Pay:</strong> ${loadedArchiveDetails.totalDailyPay ? loadedArchiveDetails.totalDailyPay.toFixed(2) : '0.00'}</p>
                            <p><strong>Total Hourly Pay:</strong> ${loadedArchiveDetails.totalHourlyPay ? loadedArchiveDetails.totalHourlyPay.toFixed(2) : '0.00'}</p>
                            <p><strong>Total 1099 Expense:</strong> ${loadedArchiveDetails.total1099Expense ? loadedArchiveDetails.total1099Expense.toFixed(2) : '0.00'}</p>
                            <p className="mt-2"><strong>Weekly Notes:</strong> {loadedArchiveDetails.weeklyNotes}</p>
                        </div>
                    )}
                    <p className="text-sm text-gray-400 mt-4 text-center">
                        **Important:** Loading a past payroll will replace the current data in the calculator for review. Remember to save if you make changes you want to keep for the *current* week before loading a past week.
                    </p>
                </div>

                {/* Archive Payroll Modal */}
                {showArchiveModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-xl shadow-2xl border border-white/20 w-full max-w-md relative animate-fade-in-up">
                            <button
                                onClick={() => setShowArchiveModal(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors duration-200"
                                aria-label="Close"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                                <Save className="w-6 h-6 mr-3 text-green-400" />
                                Finalize & Archive Payroll
                            </h2>

                            {/* NEW: Pay Date Field (on top) */}
                            <div className="mb-4">
                                <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="payDate">
                                    Payroll Pay Date: <span className="text-red-400">*</span>
                                </label>
                                <DatePicker
                                    selected={payDate}
                                    onChange={(date) => setPayDate(date)}
                                    className="w-full px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                    dateFormat="MM/dd/yyyy"
                                    placeholderText="Select pay date"
                                />
                                <p className="text-gray-400 text-xs mt-1">This date will be the primary identifier for this archived payroll record.</p>
                            </div>

                            {/* Existing Period Start Date */}
                            <div className="mb-4">
                                <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="startDate">
                                    Payroll Period Start Date: <span className="text-red-400">*</span>
                                </label>
                                <DatePicker
                                    selected={periodStartDate}
                                    onChange={(date) => setPeriodStartDate(date)}
                                    selectsStart
                                    startDate={periodStartDate}
                                    endDate={periodEndDate}
                                    className="w-full px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                    dateFormat="MM/dd/yyyy"
                                    placeholderText="Select start date"
                                />
                            </div>

                            {/* Existing Period End Date */}
                            <div className="mb-6">
                                <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="endDate">
                                    Payroll Period End Date: <span className="text-red-400">*</span>
                                </label>
                                <DatePicker
                                    selected={periodEndDate}
                                    onChange={(date) => setPeriodEndDate(date)}
                                    selectsEnd
                                    startDate={periodStartDate}
                                    endDate={periodEndDate}
                                    minDate={periodStartDate} // End date cannot be before start date
                                    className="w-full px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                    dateFormat="MM/dd/yyyy"
                                    placeholderText="Select end date"
                                />
                            </div>

                            <div className="mb-6">
                                <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="modalNotes">
                                    Weekly Notes (for archive):
                                </label>
                                <textarea
                                    id="modalNotes"
                                    value={tempWeeklyNotes}
                                    onChange={(e) => setTempWeeklyNotes(e.target.value)}
                                    rows="3"
                                    placeholder="Add any specific notes for this archived payroll week..."
                                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                ></textarea>
                            </div>

                            <button
                                onClick={finalizeAndArchivePayroll}
                                disabled={isCalculating || !payDate || !periodStartDate || !periodEndDate} // All three dates are required now
                                className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-500 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isCalculating ? (
                                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                ) : (
                                    <Save className="w-5 h-5 mr-2" />
                                )}
                                Confirm & Archive
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default DriverPayCalculator;
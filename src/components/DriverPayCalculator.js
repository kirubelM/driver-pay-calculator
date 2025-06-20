// src/components/DriverPayCalculator.js
import React, { useState, useEffect, useCallback } from 'react';
import { Calculator, Users, DollarSign, Calendar, Clock, FileText, Download, Settings, RefreshCw, TrendingUp, Save } from 'lucide-react';
import BBA_LOGO from '../img/as.png'; // Adjust the path as necessary

// Import Firebase (adjust path if you have a separate firebase config file)
import {
    db
} from '../firebaseConfig'; // Assuming firebaseConfig.js is in the parent directory
import {
    doc,
    getDoc,
    setDoc,
    collection, // NEW: for querying collections
    query,       // NEW: for building queries
    getDocs,    // NEW: for getting multiple documents from a query
    orderBy     // NEW: for ordering query results
} from 'firebase/firestore';

const defaultDriverData = {
    "Adisu": { dailyRate: 250, hourlyRate: 25, daysWorked: 10, hoursWorked: 0, expense1099: 0, comments: "-" },
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
    const [driverData, setDriverData] = useState({}); // Initialize as empty, will load from Firebase
    const [showSettings, setShowSettings] = useState(false);
    const [payResults, setPayResults] = useState([]);
    const [totalPay, setTotalPay] = useState(0);
    const [isCalculating, setIsCalculating] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // State for initial data load and fetching archived lists

    // NEW STATES FOR LOOKBACK FEATURE
    const [archivedWeeks, setArchivedWeeks] = useState([]); // Stores list of { id: '...', archiveDate: '...' }
    const [selectedArchiveId, setSelectedArchiveId] = useState(''); // Stores the ID of the currently selected archive
    const [weeklyNotes, setWeeklyNotes] = useState(""); // State for current week's overall notes
    // State to hold comprehensive details of the currently loaded archived payroll
    const [loadedArchiveDetails, setLoadedArchiveDetails] = useState(null);

    // --- IMPORTANT FIX: Move useCallback definitions here, BEFORE they are used in useEffect ---

    // Function to save current driver data to Firebase (overwrites 'currentData')
    // This is now primarily called by calculateAllDrivers and archiveCurrentPayroll
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
        } catch (error) {
            console.error("Error saving current data to Firebase:", error);
            alert("Failed to save current data.");
        }
    }, []);

    // Function to fetch the list of all archived payroll weeks
    const fetchArchivedWeeksList = useCallback(async () => {
        setIsLoading(true); // Indicate fetching lists
        try {
            // Order by archiveTimestamp descending to show most recent first
            const q = query(collection(db, "payrollHistory"), orderBy("archiveTimestamp", "desc"));
            const querySnapshot = await getDocs(q);
            const weeks = querySnapshot.docs.map(doc => ({
                id: doc.id,
                // Display relevant dates for selection
                displayDate: doc.data().periodStartDate && doc.data().periodEndDate
                    ? `${doc.data().periodStartDate} to ${doc.data().periodEndDate}`
                    : (doc.data().archiveTimestamp ? `Archived: ${new Date(doc.data().archiveTimestamp).toLocaleDateString()}` : 'N/A Date'),
                // Store actual archiveTimestamp for sorting and future reference
                archiveTimestamp: doc.data().archiveTimestamp
            }));
            setArchivedWeeks(weeks);
            // Optionally, pre-select the most recent one if any exist
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
    }, [selectedArchiveId]); // selectedArchiveId as dependency for pre-selection logic

    // Function to load a selected archived payroll data
    const loadSelectedArchive = useCallback(async () => {
        if (!selectedArchiveId) {
            alert("Please select a payroll week to load.");
            return;
        }

        setIsLoading(true); // Indicate loading data
        try {
            const docRef = doc(db, "payrollHistory", selectedArchiveId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                setDriverData(data.driverData || defaultDriverData);
                setPayResults(data.payResults || []);
                setTotalPay(data.totalPay || 0);
                setWeeklyNotes(""); // Clear current weekly notes when loading an archive
                // Store all the archive's metadata in loadedArchiveDetails state
                setLoadedArchiveDetails({
                    periodStartDate: data.periodStartDate,
                    periodEndDate: data.periodEndDate,
                    archiveTimestamp: data.archiveTimestamp,
                    numberOfDrivers: data.numberOfDrivers,
                    totalDailyPay: data.totalDailyPay,
                    totalHourlyPay: data.totalHourlyPay, // Corrected from data.hourlyPay
                    totalRegularPay: data.totalRegularPay,
                    total1099Expense: data.total1099Expense,
                    weeklyNotes: data.weeklyNotes || "No specific notes for this archived week.",
                    // archivedByUserId: data.archivedByUserId, // Uncomment if using auth
                    // archivedByUserEmail: data.archivedByUserEmail, // Uncomment if using auth
                });
                alert(`Payroll data for "${selectedArchiveId}" loaded! You can now review it.`);
                console.log("Archived data loaded:", data);
            } else {
                alert("The selected archived payroll was not found.");
                console.log(`No archived document found with ID: ${selectedArchiveId}`);
                setLoadedArchiveDetails(null); // Clear if not found
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

    // Updated calculateAllDrivers to also save data after calculation
    const calculateAllDrivers = useCallback(() => {
        setIsCalculating(true);

        setTimeout(async () => { // Made async to await saveCurrentDataToFirebase
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
                    // Consider adding a visual warning here
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

            // Automatically save the current calculated data to Firebase
            await saveCurrentDataToFirebase(driverData, results, totalPayAll);
            alert("Payroll calculated and current data saved automatically!");

        }, 800); // Small delay for visual feedback
    }, [driverData, saveCurrentDataToFirebase]); // Dependencies for useCallback

    const resetToDefaults = async () => { // Made async to await Firebase calls
        if (window.confirm("Are you sure you want to reset all data to defaults? This will also clear the current data from Firebase.")) {
            // Reset local state first
            setDriverData(defaultDriverData);
            setPayResults([]);
            setTotalPay(0);
            setWeeklyNotes(""); // Clear weekly notes
            setLoadedArchiveDetails(null); // Clear loaded archive details
            localStorage.removeItem('driverPayData'); // Clear local storage (if still used)

            // Clear data from Firebase 'currentData' document
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
            ...payResults.map(result => [
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
            weeklyNotes, // Include current weekly notes in the export
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
        reader.onload = async (e) => { // Made async to save imported data to Firebase
            try {
                const importedData = JSON.parse(e.target.result);
                if (importedData.driverData) {
                    setDriverData(importedData.driverData);
                    setPayResults(importedData.payResults || []);
                    setTotalPay(importedData.totalPay || 0);
                    setWeeklyNotes(importedData.weeklyNotes || ""); // Import weekly notes
                    setLoadedArchiveDetails(null); // Clear loaded archive details

                    // Save imported data to Firebase as current data
                    await saveCurrentDataToFirebase(
                        importedData.driverData,
                        importedData.payResults || [],
                        importedData.totalPay || 0
                    );
                    alert("Data imported successfully and saved to Firebase as current data!");
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

    // --- NEW: ARCHIVING AND LOOKBACK FUNCTIONS ---

    // Function to archive the current payroll data
    const archiveCurrentPayroll = useCallback(async () => {
        if (!window.confirm("Are you sure you want to finalize and archive the current payroll? This will save a snapshot and clear the current work area for the next week.")) {
            return;
        }

        setIsCalculating(true); // Indicate archiving in progress

        try {
            // --- 1. Calculate Date Information for the Archive ---
            const today = new Date(); // The date archiving is performed
            const archiveTimestamp = today.toISOString(); // e.g., "2025-06-20T18:15:57.000Z"

            // --- Define your payroll week logic carefully here ---
            // Example: If your payroll week ALWAYS ends on a Sunday (day 0), and you archive on Monday.
            // Adjust this logic to fit your specific business rules.
            const periodEndDate = new Date(today);
            const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

            // If today is Sunday, it's the end of the week. Otherwise, find the next Sunday.
            if (currentDayOfWeek !== 0) { // If not Sunday
                periodEndDate.setDate(today.getDate() + (7 - currentDayOfWeek));
            }
            // If today is Sunday, periodEndDate is already today.

            const periodEndDateISO = periodEndDate.toISOString().split('T')[0]; // "YYYY-MM-DD"

            const periodStartDate = new Date(periodEndDate);
            periodStartDate.setDate(periodEndDate.getDate() - 6); // Go back 6 days to get Monday (assuming 7-day week)
            const periodStartDateISO = periodStartDate.toISOString().split('T')[0]; // "YYYY-MM-DD"

            // Construct a descriptive ID for the archive document
            const payrollWeekId = `payroll_${periodStartDateISO}_to_${periodEndDateISO}`;

            // --- 2. Calculate Summary Statistics from current payResults ---
            const totalDailyPay = payResults.reduce((sum, result) => sum + (result.dailyPay || 0), 0);
            const totalHourlyPay = payResults.reduce((sum, result) => sum + (result.hourlyPay || 0), 0);
            const totalRegularPayCalculated = payResults.reduce((sum, result) => sum + (result.regularPay || 0), 0);
            const total1099Expense = payResults.reduce((sum, result) => sum + (result.expense1099 || 0), 0);
            const numberOfDrivers = Object.keys(driverData).length;

            // --- 3. (Optional) Get User Information if using Firebase Auth ---
            // import { getAuth } from 'firebase/auth'; // Uncomment this import at the top
            // const auth = getAuth();
            // const currentUser = auth.currentUser;
            // let archivedByUserId = null;
            // let archivedByUserEmail = null;
            // if (currentUser) {
            //     archivedByUserId = currentUser.uid;
            //     archivedByUserEmail = currentUser.email;
            // }

            // 4. Reference the new document in the 'payrollHistory' collection
            const historyDocRef = doc(db, "payrollHistory", payrollWeekId);

            // 5. Save the current state AND new details to the history collection
            await setDoc(historyDocRef, {
                driverData: driverData,
                payResults: payResults,
                totalPay: totalPay, // Overall total from current state
                // New detailed fields:
                periodStartDate: periodStartDateISO,
                periodEndDate: periodEndDateISO,
                archiveTimestamp: archiveTimestamp,
                numberOfDrivers: numberOfDrivers,
                totalDailyPay: totalDailyPay,
                totalHourlyPay: totalHourlyPay,
                totalRegularPay: totalRegularPayCalculated,
                total1099Expense: total1099Expense,
                weeklyNotes: weeklyNotes, // Include the current weekly notes
                // archivedByUserId: archivedByUserId, // Uncomment if using auth
                // archivedByUserEmail: archivedByUserEmail, // Uncomment if using auth
            });

            console.log(`Current payroll archived as: ${payrollWeekId}`);
            alert(`Payroll successfully archived for period ${periodStartDateISO} - ${periodEndDateISO}!`);

            // 6. Reset the "currentData" document in Firebase and in local state
            await saveCurrentDataToFirebase(defaultDriverData, [], 0); // Save default values to currentData
            setDriverData(defaultDriverData);
            setPayResults([]);
            setTotalPay(0);
            setWeeklyNotes(""); // Clear weekly notes for the new period
            setLoadedArchiveDetails(null); // Clear loaded archive details after archiving
            console.log("Current payroll data reset for next period.");

            // 7. Refresh the list of archived weeks so the new one appears in the dropdown
            await fetchArchivedWeeksList();

        } catch (error) {
            console.error("Error archiving payroll:", error);
            alert("Failed to archive payroll data.");
        } finally {
            setIsCalculating(false);
        }
    }, [driverData, payResults, totalPay, weeklyNotes, saveCurrentDataToFirebase, fetchArchivedWeeksList]);


    // --- END NEW FUNCTIONS ---

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
                    // You might want to load weeklyNotes from 'currentData' if you ever saved it there
                    // For now, assume weeklyNotes only stored in archive.
                    setWeeklyNotes(""); // Ensure current weekly notes are clear on fresh load
                    console.log("Current driver data loaded from Firebase.");
                } else {
                    // If no 'currentData' exists, initialize with defaults and save it
                    console.log("No 'currentData' found, initializing with defaults and saving.");
                    await saveCurrentDataToFirebase(defaultDriverData, [], 0);
                    setDriverData(defaultDriverData);
                    setPayResults([]);
                    setTotalPay(0);
                }
            } catch (error) {
                console.error("Error loading initial current data:", error);
                alert("Failed to load initial data. Using default data. Please check console.");
                setDriverData(defaultDriverData); // Fallback to default on error
                setPayResults([]);
                setTotalPay(0);
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialData();
        fetchArchivedWeeksList(); // Also fetch archived weeks list on initial load
    }, [saveCurrentDataToFirebase, fetchArchivedWeeksList]);


    // Re-calculate pay whenever driverData changes (and thus trigger a save of current data)
    useEffect(() => {
        // Only calculate if driverData is not empty (i.e., after initial load or reset)
        if (Object.keys(driverData).length > 0) {
            calculateAllDrivers(); // This will also trigger a save of current data
        }
    }, [driverData, calculateAllDrivers]);


    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-900 text-white flex items-center justify-center">
                <RefreshCw className="w-10 h-10 animate-spin mr-3" />
                <p className="text-xl">Loading data from server...</p>
            </div>
        );
    }

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

                    {/* Calculate Pay button now also saves current data */}
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
                        {isCalculating ? 'Calculating...' : 'Calculate & Save Current Pay'}
                    </button>

                    {/* Finalize & Archive Payroll Button */}
                    <button
                        onClick={archiveCurrentPayroll}
                        disabled={isCalculating || payResults.length === 0} // Disable if no results calculated
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-500 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="w-5 h-5 mr-2" />
                        {isCalculating ? 'Archiving...' : 'Finalize & Archive Payroll'}
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

                {/* NEW: Input for Weekly Notes */}
                <div className="mb-8 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
                    <div className="flex items-center mb-6">
                        <FileText className="w-6 h-6 text-yellow-400 mr-3" />
                        <h2 className="text-2xl font-bold text-white">Overall Weekly Notes (Current Period)</h2>
                    </div>
                    <textarea
                        value={weeklyNotes}
                        onChange={(e) => setWeeklyNotes(e.target.value)}
                        rows="3"
                        placeholder="Add any general notes for this payroll week (e.g., 'Holiday adjustments', 'New driver onboarding')..."
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
                                        {payResults.map(result => (
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
                            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex-grow"
                            disabled={isLoading || archivedWeeks.length === 0}
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
                            <p><strong>Period:</strong> {loadedArchiveDetails.periodStartDate} to {loadedArchiveDetails.periodEndDate}</p>
                            <p><strong>Archived On:</strong> {loadedArchiveDetails.archiveTimestamp ? new Date(loadedArchiveDetails.archiveTimestamp).toLocaleString() : 'N/A'}</p>
                            <p><strong>Total Drivers:</strong> {loadedArchiveDetails.numberOfDrivers}</p>
                            <p><strong>Total Payroll Amount:</strong> ${loadedArchiveDetails.totalPay ? loadedArchiveDetails.totalPay.toFixed(2) : '0.00'}</p>
                            <p><strong>Total Daily Pay:</strong> ${loadedArchiveDetails.totalDailyPay ? loadedArchiveDetails.totalDailyPay.toFixed(2) : '0.00'}</p>
                            <p><strong>Total Hourly Pay:</strong> ${loadedArchiveDetails.totalHourlyPay ? loadedArchiveDetails.totalHourlyPay.toFixed(2) : '0.00'}</p>
                            <p><strong>Total 1099 Expense:</strong> ${loadedArchiveDetails.total1099Expense ? loadedArchiveDetails.total1099Expense.toFixed(2) : '0.00'}</p>
                            <p className="mt-2"><strong>Weekly Notes:</strong> {loadedArchiveDetails.weeklyNotes}</p>
                            {/* Add archivedByUserId/Email here if you implement auth */}
                        </div>
                    )}
                    <p className="text-sm text-gray-400 mt-4 text-center">
                        **Important:** Loading a past payroll will replace the current data in the calculator for review. Remember to save if you make changes you want to keep for the *current* week before loading a past week.
                    </p>
                </div>

            </div> {/* End container */}
        </div> // End main div
    );
};

export default DriverPayCalculator;
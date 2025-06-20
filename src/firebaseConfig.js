// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA0CTuFY9ZgND2YvekIAD7n6Hj8XUA8u1I",
  authDomain: "bba-payroll-calculator.firebaseapp.com",
  projectId: "bba-payroll-calculator",
  storageBucket: "bba-payroll-calculator.firebasestorage.app",
  messagingSenderId: "239862416938",
  appId: "1:239862416938:web:6a81b8ea348f4dc5ef6553",
  measurementId: "G-QY5VFEQ8R4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

export { db }; // <-- THIS LINE IS CRUCIAL
// firebase-config.js - Updated version
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "IzaSyD_xMLlmD6t93eVUD5pNEJavrZV2_CBEUY",
  authDomain: "playerwarnings.firebaseapp.com",
  projectId: "playerwarnings",
  storageBucket: "playerwarnings.firebasestorage.app",
  messagingSenderId: "909433658976",
  appId: "1:909433658976:web:c298804a818e953d65ed05",
  measurementId: "G-82XKZNFL7H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Export what we'll need
export { db, collection, getDocs, addDoc, deleteDoc, doc, onSnapshot };
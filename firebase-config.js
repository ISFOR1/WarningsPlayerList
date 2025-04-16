// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "warnings-system.firebaseapp.com",
  databaseURL: "https://warnings-system-default-rtdb.firebaseio.com",
  projectId: "warnings-system",
  storageBucket: "warnings-system.appspot.com",
  messagingSenderId: "XXXXXXXXXXXX",
  appId: "1:XXXXXXXXXXXX:web:XXXXXXXXXXXXXXXXXXXX"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get a reference to the database
const database = firebase.database();

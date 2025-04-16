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

// Initialize Firebase with retry mechanism
let initAttempts = 0;
const maxAttempts = 3;

function initializeFirebase() {
    try {
        // Check if Firebase is already initialized
        if (!firebase.apps.length) {
            console.log("Initializing Firebase...");
            firebase.initializeApp(firebaseConfig);
            console.log("Firebase initialized successfully");
        } else {
            console.log("Firebase already initialized");
        }
        
        // Get a reference to the database
        const database = firebase.database();
        
        // Test database connection
        const testRef = database.ref('.info/connected');
        testRef.once('value')
            .then(() => {
                console.log("Firebase database connection successful");
            })
            .catch(error => {
                console.error("Firebase database connection test failed:", error);
                retryInitialization();
            });
            
        return database;
    } catch (error) {
        console.error("Error initializing Firebase:", error);
        retryInitialization();
        return null;
    }
}

function retryInitialization() {
    initAttempts++;
    if (initAttempts < maxAttempts) {
        console.log(`Retrying Firebase initialization (attempt ${initAttempts + 1}/${maxAttempts})...`);
        setTimeout(initializeFirebase, 1500);
    } else {
        console.error("Failed to initialize Firebase after multiple attempts");
        alert("Could not connect to the warnings system. Please check your internet connection and refresh the page.");
    }
}

// Initialize Firebase with retry mechanism
const database = initializeFirebase();

// Helper function to check if database is connected
function isDatabaseConnected() {
    return new Promise((resolve) => {
        if (!database) {
            resolve(false);
            return;
        }
        
        const connectedRef = database.ref('.info/connected');
        connectedRef.once('value', (snapshot) => {
            resolve(snapshot.val() === true);
        });
    });
}

// Export database connection status checker
window.checkDatabaseConnection = isDatabaseConnected;

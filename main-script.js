// Import Firebase modules
import { db, collection, getDocs, addDoc, deleteDoc, doc, onSnapshot } from './firebase-config.js';

// Cookie utility functions - using same approach as login-script.js
const CookieUtil = {
    setCookie(name, value, days) {
        try {
            const expires = new Date();
            expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
            document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))};expires=${expires.toUTCString()};path=/`;
            return true;
        } catch (error) {
            console.error("Error setting cookie:", error);
            return false;
        }
    },
    
    getCookie(name) {
        try {
            const cookieArr = document.cookie.split(";");
            for (let i = 0; i < cookieArr.length; i++) {
                const cookiePair = cookieArr[i].split("=");
                const cookieName = cookiePair[0].trim();
                if (cookieName === name) {
                    return JSON.parse(decodeURIComponent(cookiePair[1]));
                }
            }
            return null;
        } catch (error) {
            console.error("Error getting cookie:", error);
            return null;
        }
    },
    
    deleteCookie(name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    }
};

// Staff members data - consistent with login-script.js
const staffMembers = [
    { name: "ROBLOX", role: "owner" },
    { name: "IAMISFOR", role: "high-support" },
    { name: "ModeratorA", role: "high-support" },
    { name: "Helper789", role: "support" },
    { name: "Helper456", role: "support" },
    { name: "Helper123", role: "support" }
];

// DOM Elements
const logoutBtn = document.getElementById('logout-btn');
const themeToggle = document.getElementById('theme-toggle');
const addWarningBtn = document.getElementById('add-warning-btn');
const warningForm = document.getElementById('warning-form');
const usernameInput = document.getElementById('username');
const reasonInput = document.getElementById('reason');
const staffInput = document.getElementById('staff');
const staffDropdown = document.getElementById('staff-dropdown');
const banPlayerCheckbox = document.getElementById('ban-player');
const applyBtn = document.getElementById('apply-btn');
const searchPlayer = document.getElementById('search-player');
const showBanned = document.getElementById('show-banned');
const showActive = document.getElementById('show-active');
const warningsList = document.getElementById('warnings-list');
const saveStatus = document.getElementById('save-status');
const errorStatus = document.getElementById('error-status');
const loadingIndicator = document.getElementById('loading-indicator');

// Current staff
let currentStaff = null;

// Warnings data
let warnings = [];

// Show/hide loading indicator
function showLoading() {
    if (loadingIndicator) loadingIndicator.style.display = 'flex';
}

function hideLoading() {
    if (loadingIndicator) loadingIndicator.style.display = 'none';
}

// Theme Management
function setTheme(isDark) {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('dark-theme', isDark);
}

// Check for saved theme preference or use user preference
const savedTheme = localStorage.getItem('dark-theme');
const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

if (savedTheme !== null) {
    if (themeToggle) {
        themeToggle.checked = savedTheme === 'true';
    }
    setTheme(savedTheme === 'true');
} else {
    if (themeToggle) {
        themeToggle.checked = prefersDark;
    }
    setTheme(prefersDark);
}

// Firestore references
const warningsCollectionRef = collection(db, 'warnings');

// Load warnings from Firestore
async function loadWarnings() {
    showLoading();
    
    try {
        const querySnapshot = await getDocs(warningsCollectionRef);
        warnings = [];
        querySnapshot.forEach((doc) => {
            warnings.push({ id: doc.id, ...doc.data() });
        });
        renderWarnings();
    } catch (error) {
        console.error("Error loading warnings:", error);
        showError("Failed to load warnings from the server.");
    } finally {
        hideLoading();
    }
}

// Authentication check
function checkAuth() {
    const staffData = CookieUtil.getCookie('currentStaff');
    if (!staffData) {
        // Not logged in, redirect to login page
        window.location.href = 'index.html';
        return false;
    }
    
    // Set staff name in dropdown
    if (staffInput) {
        staffInput.value = staffData.name;
    }
    
    // Store the current staff globally
    currentStaff = staffData;
    
    return staffData;
}

// Check if current user is owner
function isOwner() {
    return currentStaff && currentStaff.role === 'owner';
}

// Handle logout
function handleLogout() {
    CookieUtil.deleteCookie('currentStaff');
    window.location.href = 'index.html';
}

// Toggle warning form
function toggleWarningForm() {
    if (warningForm) {
        warningForm.style.display = warningForm.style.display === 'none' ? 'block' : 'none';
    }
}

// Populate staff dropdown
function populateStaffDropdown() {
    if (!staffDropdown) return;
    
    staffDropdown.innerHTML = '';
    
    staffMembers.forEach(staff => {
        const staffItem = document.createElement('div');
        staffItem.className = 'staff-item';
        staffItem.dataset.name = staff.name;
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = staff.name;
        
        const roleSpan = document.createElement('span');
        roleSpan.className = `staff-role role-${staff.role}`;
        roleSpan.textContent = staff.role;
        
        staffItem.appendChild(nameSpan);
        staffItem.appendChild(roleSpan);
        
        staffItem.addEventListener('click', () => {
            staffInput.value = staff.name;
            staffDropdown.classList.remove('show');
        });
        
        staffDropdown.appendChild(staffItem);
    });
}

function toggleStaffDropdown() {
    if (staffDropdown) {
        staffDropdown.classList.toggle('show');
    }
}

// Show status message
function showStatus(message) {
    if (saveStatus) {
        saveStatus.textContent = message;
        saveStatus.style.display = 'block';
        setTimeout(() => {
            saveStatus.style.display = 'none';
        }, 3000);
    }
}

// Show error message
function showError(message) {
    if (errorStatus) {
        errorStatus.textContent = message;
        errorStatus.style.display = 'block';
        setTimeout(() => {
            errorStatus.style.display = 'none';
        }, 5000);
    }
}

// Add new warning
async function addWarning(event) {
    event.preventDefault();
    
    const username = usernameInput.value.trim();
    const reason = reasonInput.value.trim();
    const staff = staffInput.value.trim();
    const isBanned = banPlayerCheckbox.checked;
    
    if (!username || !reason || !staff) {
        showError("Please fill all required fields.");
        return;
    }
    
    showLoading();
    
    const timestamp = new Date().toISOString();
    
    const newWarning = {
        username: username,
        reason: reason,
        staff: staff,
        timestamp: timestamp,
        banned: isBanned
    };
    
    try {
        // Save to Firestore
        const docRef = await addDoc(warningsCollectionRef, newWarning);
        
        // Add to local array with the generated ID
        warnings.push({
            id: docRef.id,
            ...newWarning
        });
        
        // Clear form fields
        usernameInput.value = '';
        reasonInput.value = '';
        banPlayerCheckbox.checked = false;
        
        // Update UI
        renderWarnings();
        showStatus("Warning added successfully!");
        
        // Hide form
        toggleWarningForm();
    } catch (error) {
        console.error("Error adding warning:", error);
        showError("Failed to save warning to the server.");
    } finally {
        hideLoading();
    }
}

// Delete warning
async function deleteWarning(warningId) {
    if (!isOwner()) {
        showError("Only the owner can delete warnings.");
        return;
    }
    
    if (confirm("Are you sure you want to delete this warning?")) {
        showLoading();
        
        try {
            // Delete from Firestore
            await deleteDoc(doc(db, 'warnings', warningId));
            
            // Remove from local array
            warnings = warnings.filter(warning => warning.id !== warningId);
            renderWarnings();
            showStatus("Warning deleted successfully!");
        } catch (error) {
            console.error("Error deleting warning:", error);
            showError("Failed to delete warning from the server.");
        } finally {
            hideLoading();
        }
    }
}

// Format date from ISO string
function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Render warnings list
function renderWarnings() {
    if (!warningsList) return;
    
    // Filter warnings based on search and filters
    let filteredWarnings = [...warnings];
    
    // Apply search filter
    if (searchPlayer && searchPlayer.value.trim()) {
        const searchTerm = searchPlayer.value.trim().toLowerCase();
        filteredWarnings = filteredWarnings.filter(warning => 
            warning.username.toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply banned/active filters
    if (showBanned && showBanned.checked && !showActive.checked) {
        filteredWarnings = filteredWarnings.filter(warning => warning.banned);
    } else if (showActive && showActive.checked && !showBanned.checked) {
        filteredWarnings = filteredWarnings.filter(warning => !warning.banned);
    }
    
    // Sort warnings by timestamp (newest first)
    filteredWarnings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Clear current list
    warningsList.innerHTML = '';
    
    // Render each warning
    filteredWarnings.forEach(warning => {
        const warningItem = document.createElement('div');
        warningItem.className = `warning-item ${warning.banned ? 'banned' : ''}`;
        warningItem.dataset.id = warning.id;
        
        const warningHeader = document.createElement('div');
        warningHeader.className = 'warning-header';
        
        const username = document.createElement('h3');
        username.textContent = warning.username;
        
        const status = document.createElement('span');
        status.className = 'status';
        status.textContent = warning.banned ? 'BANNED' : 'WARNING';
        
        warningHeader.appendChild(username);
        warningHeader.appendChild(status);
        
        const warningContent = document.createElement('div');
        warningContent.className = 'warning-content';
        
        const reason = document.createElement('p');
        reason.textContent = warning.reason;
        
        const meta = document.createElement('div');
        meta.className = 'warning-meta';
        meta.innerHTML = `<span>By: ${warning.staff}</span><span>Date: ${formatDate(warning.timestamp)}</span>`;
        
        warningContent.appendChild(reason);
        warningContent.appendChild(meta);
        
        warningItem.appendChild(warningHeader);
        warningItem.appendChild(warningContent);
        
        // Add delete button for owner
        if (isOwner()) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => deleteWarning(warning.id));
            warningItem.appendChild(deleteBtn);
        }
        
        warningsList.appendChild(warningItem);
    });
    
    // Show message if no warnings
    if (filteredWarnings.length === 0) {
        const noWarnings = document.createElement('p');
        noWarnings.className = 'no-warnings';
        noWarnings.textContent = 'No warnings found.';
        warningsList.appendChild(noWarnings);
    }
}

// Set up real-time updates from Firestore
function setupRealTimeUpdates() {
    const unsubscribe = onSnapshot(warningsCollectionRef, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            const warningData = { id: change.doc.id, ...change.doc.data() };
            
            if (change.type === "added") {
                // Only add if not already in the array
                if (!warnings.some(w => w.id === warningData.id)) {
                    warnings.push(warningData);
                }
            }
            else if (change.type === "modified") {
                // Update the existing warning
                const index = warnings.findIndex(w => w.id === warningData.id);
                if (index !== -1) {
                    warnings[index] = warningData;
                }
            }
            else if (change.type === "removed") {
                // Remove the warning
                warnings = warnings.filter(w => w.id !== warningData.id);
            }
        });
        
        renderWarnings();
    });
    
    // Return the unsubscribe function to potentially stop listening later
    return unsubscribe;
}

// Initialize app
function init() {
    // Check if user is authenticated
    const staff = checkAuth();
    if (!staff) return;
    
    // Set up event listeners
    if (themeToggle) {
        themeToggle.addEventListener('change', () => setTheme(themeToggle.checked));
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    if (addWarningBtn) {
        addWarningBtn.addEventListener('click', toggleWarningForm);
    }
    
    if (applyBtn) {
        applyBtn.addEventListener('click', addWarning);
    }
    
    if (staffInput) {
        staffInput.addEventListener('click', toggleStaffDropdown);
        populateStaffDropdown();
    }
    
    // Filter event listeners
    if (searchPlayer) {
        searchPlayer.addEventListener('input', renderWarnings);
    }
    
    if (showBanned) {
        showBanned.addEventListener('change', renderWarnings);
    }
    
    if (showActive) {
        showActive.addEventListener('change', renderWarnings);
    }
    
    // Click outside staff dropdown to close it
    document.addEventListener('click', (event) => {
        if (staffDropdown && staffInput && !staffInput.contains(event.target) && !staffDropdown.contains(event.target)) {
            staffDropdown.classList.remove('show');
        }
    });
    
    // Load initial warnings
    loadWarnings();
    
    // Set up real-time updates
    const unsubscribe = setupRealTimeUpdates();
    
    // Cleanup listener on page unload (optional)
    window.addEventListener('beforeunload', () => {
        unsubscribe();
    });
}

// Run initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
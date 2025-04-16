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
    { name: "IAMISFOR", role: "owner" },
    { name: "HeadMod456", role: "high-support" },
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

// Warnings data - initialize from localStorage or set default
let warnings = JSON.parse(localStorage.getItem('warnings')) || [];

// Authentication check
function checkAuth() {
    const currentStaff = CookieUtil.getCookie('currentStaff');
    if (!currentStaff) {
        // Not logged in, redirect to login page
        window.location.href = 'index.html';
        return false;
    }
    
    // Set staff name in dropdown
    if (staffInput) {
        staffInput.value = currentStaff.name;
    }
    
    return currentStaff;
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

// Toggle staff dropdown
function toggleStaffDropdown() {
    if (staffDropdown) {
        staffDropdown.classList.toggle('show');
    }
}

// Apply warning
function applyWarning() {
    const username = usernameInput ? usernameInput.value.trim() : '';
    const reason = reasonInput ? reasonInput.value.trim() : '';
    const staff = staffInput ? staffInput.value.trim() : '';
    const isBanned = banPlayerCheckbox ? banPlayerCheckbox.checked : false;
    
    if (!username || !reason || !staff) {
        showError('Please fill all required fields.');
        return;
    }
    
    // Find existing player or create new one
    let player = warnings.find(w => w.username.toLowerCase() === username.toLowerCase());
    
    if (!player) {
        player = {
            username: username,
            warnings: [],
            isBanned: false
        };
        warnings.push(player);
    }
    
    // Add new warning
    const warning = {
        id: Date.now(),
        reason: reason,
        staff: staff,
        date: new Date().toISOString()
    };
    
    player.warnings.push(warning);
    
    // Update banned status
    if (isBanned) {
        player.isBanned = true;
    }
    
    // Save to localStorage
    saveWarnings();
    
    // Clear form and hide
    if (usernameInput) usernameInput.value = '';
    if (reasonInput) reasonInput.value = '';
    if (banPlayerCheckbox) banPlayerCheckbox.checked = false;
    if (warningForm) warningForm.style.display = 'none';
    
    // Refresh warnings list
    renderWarnings();
    
    showSuccess('Warning applied successfully.');
}

// Save warnings to localStorage
function saveWarnings() {
    localStorage.setItem('warnings', JSON.stringify(warnings));
}

// Show success message
function showSuccess(message) {
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
        }, 3000);
    }
}

// Filter warnings
function filterWarnings() {
    const searchTerm = searchPlayer ? searchPlayer.value.toLowerCase() : '';
    const includeBanned = showBanned ? showBanned.checked : true;
    const includeActive = showActive ? showActive.checked : true;
    
    return warnings.filter(player => {
        // Filter by search term
        const matchesSearch = player.username.toLowerCase().includes(searchTerm);
        
        // Filter by status
        const matchesStatus = (player.isBanned && includeBanned) || (!player.isBanned && includeActive);
        
        return matchesSearch && matchesStatus;
    });
}

// Render warnings list
function renderWarnings() {
    if (!warningsList) return;
    
    const filteredWarnings = filterWarnings();
    
    if (filteredWarnings.length === 0) {
        warningsList.innerHTML = `
            <div class="empty-list">No warnings found. Add your first warning using the button above.</div>
        `;
        return;
    }
    
    warningsList.innerHTML = '';
    
    filteredWarnings.forEach(player => {
        const warningItem = document.createElement('div');
        warningItem.className = `warning-item ${player.isBanned ? 'banned' : ''}`;
        
        const header = document.createElement('div');
        header.className = 'warning-header';
        
        const titleDiv = document.createElement('div');
        const title = document.createElement('h3');
        title.className = 'warning-title';
        title.textContent = player.username;
        titleDiv.appendChild(title);
        
        const count = document.createElement('div');
        count.className = 'warning-count';
        count.textContent = `${player.warnings.length} Warning${player.warnings.length !== 1 ? 's' : ''}`;
        
        header.appendChild(titleDiv);
        header.appendChild(count);
        warningItem.appendChild(header);
        
        const subtitle = document.createElement('div');
        subtitle.className = 'warning-subtitle';
        subtitle.textContent = player.isBanned ? 'This player has been banned' : 'This player is active';
        warningItem.appendChild(subtitle);
        
        // Add warnings
        player.warnings.forEach((warning, idx) => {
            const detail = document.createElement('div');
            detail.className = 'warning-detail';
            
            const number = document.createElement('div');
            number.className = 'warning-number';
            number.textContent = `Warning #${idx + 1}`;
            
            const reason = document.createElement('div');
            reason.className = 'warning-reason';
            reason.textContent = warning.reason;
            
            const meta = document.createElement('div');
            meta.className = 'warning-meta';
            
            const staff = document.createElement('div');
            staff.className = 'warning-staff';
            staff.textContent = `Issued by: ${warning.staff}`;
            
            const date = document.createElement('div');
            date.className = 'warning-date';
            date.textContent = new Date(warning.date).toLocaleString();
            
            meta.appendChild(staff);
            meta.appendChild(date);
            
            detail.appendChild(number);
            detail.appendChild(reason);
            detail.appendChild(meta);
            
            warningItem.appendChild(detail);
        });
        
        warningsList.appendChild(warningItem);
    });
}

// Initialize app
function initApp() {
    const currentStaff = checkAuth();
    if (!currentStaff) return;
    
    // Set up event listeners
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    if (themeToggle) {
        themeToggle.addEventListener('change', (e) => {
            setTheme(e.target.checked);
        });
    }
    
    if (addWarningBtn) {
        addWarningBtn.addEventListener('click', toggleWarningForm);
    }
    
    if (staffInput) {
        staffInput.value = currentStaff.name;
        staffInput.addEventListener('click', toggleStaffDropdown);
    }
    
    if (applyBtn) {
        applyBtn.addEventListener('click', applyWarning);
    }
    
    // Search and filter listeners
    if (searchPlayer) {
        searchPlayer.addEventListener('input', renderWarnings);
    }
    
    if (showBanned) {
        showBanned.addEventListener('change', renderWarnings);
    }
    
    if (showActive) {
        showActive.addEventListener('change', renderWarnings);
    }
    
    // Initialize UI
    populateStaffDropdown();
    renderWarnings();
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (staffDropdown && staffInput && !staffInput.contains(e.target) && !staffDropdown.contains(e.target)) {
            staffDropdown.classList.remove('show');
        }
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

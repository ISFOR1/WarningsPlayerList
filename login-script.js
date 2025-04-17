// Staff members data with login credentials
const staffMembers = [
    { name: "IAMISFOR", role: "owner", username: "ISFOR", password: "ISFOR@ADMINACCESS" },
    { name: "enima", role: "high-support", username: "enima", password: "enima7away" },
    { name: "ModeratorA", role: "high-support", username: "modA", password: "modA789" },
    { name: "Helper789", role: "support", username: "helper1", password: "help789" },
    { name: "Helper456", role: "support", username: "helper2", password: "help456" },
    { name: "Helper123", role: "support", username: "helper3", password: "help123" }
];

// Cookie utility functions - consistent approach
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

// DOM Elements
const loginUsername = document.getElementById('login-username');
const loginPassword = document.getElementById('login-password');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');

// Theme Management
function setTheme(isDark) {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('dark-theme', isDark);
}

// Check for saved theme preference or use user preference
const savedTheme = localStorage.getItem('dark-theme');
const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

if (savedTheme !== null) {
    setTheme(savedTheme === 'true');
} else {
    setTheme(prefersDark);
}

// Login Function
function handleLogin() {
    const username = loginUsername.value.trim();
    const password = loginPassword.value.trim();
    
    const staff = staffMembers.find(s => 
        s.username === username && s.password === password
    );
    
    if (staff) {
        // Successful login
        const currentStaff = {
            name: staff.name,
            role: staff.role
        };
        
        CookieUtil.setCookie('currentStaff', currentStaff, 1); // Save for 1 day
        
        // Redirect to main page
        window.location.href = 'main.html';
    } else {
        // Failed login
        loginError.style.display = 'block';
        loginPassword.value = '';
    }
}

// Check if already logged in
function checkLogin() {
    const currentStaff = CookieUtil.getCookie('currentStaff');
    if (currentStaff) {
        // Already logged in, redirect to main page
        window.location.href = 'main.html';
    }
}

// Event Listeners
if (loginBtn) {
    loginBtn.addEventListener('click', handleLogin);
}

if (loginPassword) {
    loginPassword.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });
}

// Check login status when page loads
window.addEventListener('DOMContentLoaded', checkLogin);
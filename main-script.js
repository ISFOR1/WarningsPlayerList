// Staff members data
const staffMembers = [
    { name: "IAMISFOR", role: "owner" },
    { name: "ALI", role: "high-support" },
    { name: "ModeratorA", role: "high-support" },
    { name: "Helper789", role: "support" },
    { name: "Helper456", role: "support" },
    { name: "Helper123", role: "support" }
  ];
  
  // Cookie utility functions
  const CookieUtil = {
    setCookie(name, value, days) {
      try {
        const expires = new Date();
        expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
        return true;
      } catch (error) {
        console.error("Error setting cookie:", error);
        return false;
      }
    },
    
    getCookie(name) {
      try {
        const cookieName = `${name}=`;
        const cookies = document.cookie.split(';');
        
        for (let i = 0; i < cookies.length; i++) {
          let cookie = cookies[i].trim();
          if (cookie.indexOf(cookieName) === 0) {
            return cookie.substring(cookieName.length, cookie.length);
          }
        }
        return null;
      } catch (error) {
        console.error("Error getting cookie:", error);
        return null;
      }
    },
    
    deleteCookie(name) {
      try {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        return true;
      } catch (error) {
        console.error("Error deleting cookie:", error);
        return false;
      }
    }
  };
  
  // Staff verification functions
  const StaffVerifier = {
    isStaff(username) {
      return staffMembers.some(member => member.name === username);
    },
    
    getStaffRole(username) {
      const member = staffMembers.find(member => member.name === username);
      return member ? member.role : null;
    },
    
    hasPermission(username, requiredRole) {
      const member = staffMembers.find(member => member.name === username);
      if (!member) return false;
      
      switch (requiredRole) {
        case "support":
          return ["support", "high-support", "owner"].includes(member.role);
        case "high-support":
          return ["high-support", "owner"].includes(member.role);
        case "owner":
          return member.role === "owner";
        default:
          return false;
      }
    }
  };
  
  // Authentication functions
  const Auth = {
    currentUser: null,
    
    login(username, password) {
      // This would typically involve API calls to verify credentials
      // For demonstration purposes, we'll just check if the user is a staff member
      if (StaffVerifier.isStaff(username)) {
        this.currentUser = {
          username,
          role: StaffVerifier.getStaffRole(username),
          loginTime: new Date()
        };
        
        // Save user session in cookie
        CookieUtil.setCookie("currentUser", JSON.stringify(this.currentUser), 1);
        return true;
      }
      return false;
    },
    
    logout() {
      this.currentUser = null;
      CookieUtil.deleteCookie("currentUser");
      return true;
    },
    
    checkAuth() {
      if (this.currentUser) return true;
      
      const savedUser = CookieUtil.getCookie("currentUser");
      if (savedUser) {
        try {
          this.currentUser = JSON.parse(savedUser);
          return true;
        } catch (e) {
          console.error("Error parsing saved user:", e);
          CookieUtil.deleteCookie("currentUser");
        }
      }
      return false;
    }
  };
  
  // Application initialization
  function initApp() {
    // Check if user is already logged in
    if (Auth.checkAuth()) {
      showDashboard();
    } else {
      showLoginScreen();
    }
    
    // Add event listeners
    document.getElementById("loginForm")?.addEventListener("submit", handleLogin);
    document.getElementById("logoutButton")?.addEventListener("click", handleLogout);
  }
  
  // Event handlers
  function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    
    if (Auth.login(username, password)) {
      showDashboard();
    } else {
      showError("Invalid username or password");
    }
  }
  
  function handleLogout() {
    Auth.logout();
    showLoginScreen();
  }
  
  // UI functions
  function showLoginScreen() {
    const mainContent = document.getElementById("mainContent");
    if (!mainContent) return;
    
    mainContent.innerHTML = `
      <div class="login-container">
        <h2>Staff Login</h2>
        <form id="loginForm">
          <div class="form-group">
            <label for="username">Username:</label>
            <input type="text" id="username" required>
          </div>
          <div class="form-group">
            <label for="password">Password:</label>
            <input type="password" id="password" required>
          </div>
          <button type="submit">Login</button>
        </form>
      </div>
    `;
  }
  
  function showDashboard() {
    if (!Auth.currentUser) {
      showLoginScreen();
      return;
    }
    
    const mainContent = document.getElementById("mainContent");
    if (!mainContent) return;
    
    mainContent.innerHTML = `
      <div class="dashboard">
        <header>
          <h2>Welcome, ${Auth.currentUser.username}</h2>
          <span class="role-badge ${Auth.currentUser.role}">${Auth.currentUser.role}</span>
          <button id="logoutButton">Logout</button>
        </header>
        <div class="dashboard-content">
          ${getDashboardContentByRole(Auth.currentUser.role)}
        </div>
      </div>
    `;
  }
  
  function getDashboardContentByRole(role) {
    switch (role) {
      case "owner":
        return `
          <div class="panel">
            <h3>Admin Panel</h3>
            <ul class="admin-options">
              <li><button class="admin-btn">Manage Staff</button></li>
              <li><button class="admin-btn">View Logs</button></li>
              <li><button class="admin-btn">System Settings</button></li>
            </ul>
          </div>
        `;
      case "high-support":
        return `
          <div class="panel">
            <h3>Moderation Tools</h3>
            <ul class="mod-options">
              <li><button class="mod-btn">User Management</button></li>
              <li><button class="mod-btn">Content Review</button></li>
              <li><button class="mod-btn">Support Tickets</button></li>
            </ul>
          </div>
        `;
      case "support":
        return `
          <div class="panel">
            <h3>Support Tools</h3>
            <ul class="support-options">
              <li><button class="support-btn">View Tickets</button></li>
              <li><button class="support-btn">User Lookup</button></li>
            </ul>
          </div>
        `;
      default:
        return `<p>No dashboard content available for your role.</p>`;
    }
  }
  
  function showError(message) {
    const errorDiv = document.getElementById("errorMessage");
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = "block";
      
      // Hide error after 3 seconds
      setTimeout(() => {
        errorDiv.style.display = "none";
      }, 3000);
    } else {
      alert(message);
    }
  }
  
  // Initialize app when DOM is fully loaded
  document.addEventListener("DOMContentLoaded", initApp);

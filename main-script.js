// Toggle staff dropdown visibility
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
function addWarning(event) {
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
    const warningId = `warning_${Date.now()}`;
    
    const newWarning = {
        id: warningId,
        username: username,
        reason: reason,
        staff: staff,
        timestamp: timestamp,
        banned: isBanned
    };
    
    // Save to Firebase
    warningsRef.child(warningId).set(newWarning)
        .then(() => {
            // Add to local array
            warnings.push(newWarning);
            
            // Clear form fields
            usernameInput.value = '';
            reasonInput.value = '';
            banPlayerCheckbox.checked = false;
            
            // Update UI
            renderWarnings();
            showStatus("Warning added successfully!");
            hideLoading();
            
            // Hide form
            toggleWarningForm();
        })
        .catch(error => {
            console.error("Error adding warning:", error);
            showError("Failed to save warning to the server.");
            hideLoading();
        });
}

// Delete warning
function deleteWarning(warningId) {
    if (!isOwner()) {
        showError("Only the owner can delete warnings.");
        return;
    }
    
    if (confirm("Are you sure you want to delete this warning?")) {
        showLoading();
        
        warningsRef.child(warningId).remove()
            .then(() => {
                warnings = warnings.filter(warning => warning.id !== warningId);
                renderWarnings();
                showStatus("Warning deleted successfully!");
                hideLoading();
            })
            .catch(error => {
                console.error("Error deleting warning:", error);
                showError("Failed to delete warning from the server.");
                hideLoading();
            });
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

// Set up real-time updates from Firebase
function setupRealTimeUpdates() {
    // Listen for added warnings
    warningsRef.on('child_added', snapshot => {
        const newWarning = snapshot.val();
        // Only add if not already in the array
        if (!warnings.some(w => w.id === newWarning.id)) {
            warnings.push(newWarning);
            renderWarnings();
        }
    });
    
    // Listen for removed warnings
    warningsRef.on('child_removed', snapshot => {
        const removedId = snapshot.val().id;
        warnings = warnings.filter(w => w.id !== removedId);
        renderWarnings();
    });
    
    // Listen for changed warnings
    warningsRef.on('child_changed', snapshot => {
        const changedWarning = snapshot.val();
        const index = warnings.findIndex(w => w.id === changedWarning.id);
        if (index !== -1) {
            warnings[index] = changedWarning;
            renderWarnings();
        }
    });
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
    
    if (warningForm) {
        warningForm.addEventListener('submit', addWarning);
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
    setupRealTimeUpdates();
}

// Run initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

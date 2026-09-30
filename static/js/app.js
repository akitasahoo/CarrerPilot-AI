/**
 * CareerPilot AI - Main Application Controller (app.js)
 * Manages Auth Gateway first flow, dynamic role theme switching, collapsible sidebar,
 * navigation routing, and toast notifications.
 */

class Application {
    constructor() {
        this.currentView = 'dashboard';
        this.theme = localStorage.getItem('careerpilot_theme') || 'dark';
        this.user = JSON.parse(localStorage.getItem('careerpilot_user')) || null;
        this.isGatewaySignup = false;
        this.notifications = [
            { id: 1, text: 'ATS Score updated to 88/100 after keyword boost', time: '10 mins ago', type: 'success' },
            { id: 2, text: 'AI Mock Interview report generated for Software Engineer', time: '1 hour ago', type: 'info' },
            { id: 3, text: 'New feature: Added 4th ATS template Executive Minimal', time: 'Yesterday', type: 'system' }
        ];
    }

    init() {
        console.log('🚀 CareerPilot AI Initializing...');
        this.applyTheme(this.theme);
        this.renderNotifications();

        // Check authentication status
        if (this.user && this.user.isLoggedIn) {
            this.showAppLayout();
        } else {
            this.showAuthGateway();
        }

        // Handle URL hash routing
        const hash = window.location.hash.replace('#', '');
        if (hash && ['dashboard', 'profile', 'builder', 'analyzer', 'interview', 'admin'].includes(hash)) {
            this.navigateTo(hash);
        } else {
            this.navigateTo('dashboard');
        }

        // Add Hash change listener
        window.addEventListener('hashchange', () => {
            const newHash = window.location.hash.replace('#', '');
            if (newHash && newHash !== this.currentView) {
                this.navigateTo(newHash, false);
            }
        });
    }

    showAuthGateway() {
        const gatewayView = document.getElementById('authGatewayView');
        const appNavbar = document.getElementById('appNavbar');
        const mainLayout = document.querySelector('.main-layout');

        if (gatewayView) gatewayView.style.display = 'flex';
        if (appNavbar) appNavbar.style.display = 'none';
        if (mainLayout) mainLayout.style.display = 'none';
    }

    async showAppLayout() {
        const gatewayView = document.getElementById('authGatewayView');
        const appNavbar = document.getElementById('appNavbar');
        const mainLayout = document.querySelector('.main-layout');

        if (gatewayView) gatewayView.style.display = 'none';
        if (appNavbar) appNavbar.style.display = 'flex';
        if (mainLayout) mainLayout.style.display = 'flex';

        this.applyUserRoleTheme(this.user.role);

        // Fetch user-specific profile from Flask API to prevent cross-account profile picture leaking
        try {
            const res = await fetch('/api/profile');
            const profileData = await res.json();
            if (profileData && profileData.email && window.profileManager) {
                profileManager.profileData = profileData;
                profileManager.render();
            } else if (window.profileManager) {
    profileManager.profileData = profileManager.getDefaultData(this.user);
    profileManager.render();
}
        } catch (e) {
            if (window.profileManager) {
                profileManager.profileData = profileManager.getDefaultData(this.user);
                profileManager.render();
            }
        }

        this.renderUserNav();
    }

    applyUserRoleTheme(role) {
        // Reddish & Orangish theme for Admin, Indigo/Purple theme for Job Seeker
        document.documentElement.setAttribute('data-user-role', role || 'jobseeker');
    }

    navigateTo(viewId, updateHash = true) {
        if (!this.user || !this.user.isLoggedIn) {
            this.showAuthGateway();
            return;
        }

        if (viewId === 'admin' && this.user.role !== 'admin') {
            this.showToast('Admin privileges required to access Admin Panel', 'error');
            return;
        }

        this.currentView = viewId;

        // Update active tab buttons in sidebar
        document.querySelectorAll('.sidebar-item').forEach(el => {
            el.classList.remove('active');
            if (el.getAttribute('data-view') === viewId) {
                el.classList.add('active');
            }
        });

        // Hide all view panels and display target
        document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
        const targetPanel = document.getElementById(`view-${viewId}`);
        if (targetPanel) {
            targetPanel.classList.add('active');
        }

        if (updateHash) {
            window.location.hash = viewId;
        }

        // Trigger view-specific re-renders
        if (viewId === 'dashboard' && window.dashboard) dashboard.render();
        if (viewId === 'profile' && window.profileManager) profileManager.render();
        if (viewId === 'builder' && window.resumeBuilder) resumeBuilder.renderPreview();
        if (viewId === 'admin' && window.adminPanel) adminPanel.render();
    }

    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        this.applyTheme(this.theme);
        localStorage.setItem('careerpilot_theme', this.theme);
        this.showToast(`Switched to ${this.theme.toUpperCase()} theme`, 'info');
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const themeIcon = document.getElementById('themeIcon');
        if (themeIcon) {
            themeIcon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        }
    }

    getAvatarForUser(user) {
        if (!user) return '/static/images/avatar-female.svg';
        if (user.role === 'admin') return '/static/images/avatar-admin.svg';
        
        const gender = (user.gender || 'female').toLowerCase();
        if (gender === 'male') return '/static/images/avatar-male.svg';
        return '/static/images/avatar-female.svg';
    }

    renderUserNav() {
        const userNavArea = document.getElementById('userNavArea');
        const adminLinks = document.querySelectorAll('.admin-only');
        const profile = profileManager ? profileManager.profileData : {};

        if (this.user && this.user.isLoggedIn) {
            const isUserAdmin = this.user.role === 'admin';
            
            // Name display: "Admin" for admin accounts, candidate name for job seekers
            const displayName = isUserAdmin ? 'Admin' : (this.user.name || 'Job Seeker');
            const avatarUrl = this.getAvatarForUser(this.user);

            if (userNavArea) {
                userNavArea.innerHTML = `
                    <div class="user-profile-menu" style="display: flex; align-items: center; gap: 0.85rem;">
                        <img src="${avatarUrl}" class="sidebar-avatar" style="width: 38px; height: 38px;" alt="Avatar">
                        <strong style="font-size: 0.92rem; color: var(--text-heading);">${displayName}</strong>
                        <button class="btn btn-outline btn-sm" onclick="app.logout()" title="Sign Out">
                            <i class="fa-solid fa-right-from-bracket"></i> Logout
                        </button>
                    </div>
                `;
            }

            // Toggle admin nav links visibility in sidebar
            adminLinks.forEach(link => {
                link.style.display = isUserAdmin ? 'flex' : 'none';
            });

            // Sync sidebar & dashboard greetings
            const sidebarUserName = document.getElementById('sidebarUserName');
            const sidebarUserRole = document.getElementById('sidebarUserRole');
            const sidebarAvatar = document.getElementById('sidebarAvatar');
            const dashGreetingName = document.getElementById('dashGreetingName');

            if (sidebarUserName) sidebarUserName.textContent = displayName;
            if (sidebarUserRole) sidebarUserRole.textContent = isUserAdmin ? 'System Administrator' : (profile.headline || 'Software Candidate');
            if (sidebarAvatar) sidebarAvatar.src = avatarUrl;
            if (dashGreetingName) dashGreetingName.textContent = displayName;
        }
    }

    /* Auth Gateway Handlers */
    toggleGatewayAuthMode() {
        this.isGatewaySignup = !this.isGatewaySignup;
        const nameGroup = document.getElementById('gatewayNameGroup');
        const genderGroup = document.getElementById('gatewayGenderGroup');
        const submitBtn = document.getElementById('gatewaySubmitBtn');
        const toggleText = document.getElementById('gatewayToggleText');
        const toggleBtn = document.getElementById('gatewayToggleBtn');

        if (this.isGatewaySignup) {
            if (nameGroup) nameGroup.style.display = 'block';
            if (genderGroup) genderGroup.style.display = 'block';
            if (submitBtn) submitBtn.innerHTML = 'Create Account <i class="fa-solid fa-arrow-right"></i>';
            if (toggleText) toggleText.textContent = 'Already have an account?';
            if (toggleBtn) toggleBtn.textContent = 'Sign In Instead';
        } else {
            if (nameGroup) nameGroup.style.display = 'none';
            if (genderGroup) genderGroup.style.display = 'none';
            if (submitBtn) submitBtn.innerHTML = 'Sign In to Account <i class="fa-solid fa-arrow-right"></i>';
            if (toggleText) toggleText.textContent = "Don't have an account?";
            if (toggleBtn) toggleBtn.textContent = 'Create New Account';
        }
    }

    async handleGatewayAuth() {
        const email = document.getElementById('gatewayEmail').value;
        const name = document.getElementById('gatewayName')?.value || email.split('@')[0];
        const gender = document.getElementById('gatewayGender')?.value || 'female';
        const password = document.getElementById('gatewayPassword').value || 'pass123';
        const role = email.toLowerCase().includes('admin') ? 'admin' : 'jobseeker';

        try {
            const endpoint = this.isGatewaySignup ? '/api/auth/signup' : '/api/auth/login';
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name, gender })
            });
            const data = await res.json();
            if (data.success) {
                this.user = { ...data.user, isLoggedIn: true };
                localStorage.setItem('careerpilot_user', JSON.stringify(this.user));
                this.showAppLayout();
                this.showToast(this.isGatewaySignup ? 'Account created successfully!' : `Welcome back, ${data.user.role === 'admin' ? 'Admin' : data.user.name}!`, 'success');
                this.navigateTo(data.user.role === 'admin' ? 'admin' : 'dashboard');
                return;
            } else if (data.message) {
                this.showToast(data.message, 'error');
                return;
            }
        } catch (e) {
            console.log('Using client fallback auth');
        }

        // Offline Fallback
        this.user = {
            name: role === 'admin' ? 'Admin' : name,
            email: email,
            role: role,
            gender: gender,
            title: role === 'admin' ? 'System Administrator' : 'Candidate',
            isLoggedIn: true
        };
        localStorage.setItem('careerpilot_user', JSON.stringify(this.user));
        this.showAppLayout();
        this.showToast(`Logged in as ${role === 'admin' ? 'Admin' : name}`, 'success');
        this.navigateTo(role === 'admin' ? 'admin' : 'dashboard');
    }

    async loginDemoUser(role = 'jobseeker') {
        const email = role === 'admin' ? 'admin@careerpilot.ai' : 'alex.johnson@email.com';
        const password = role === 'admin' ? 'admin123' : 'demo123';

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (data.success) {
                this.user = { ...data.user, isLoggedIn: true };
                localStorage.setItem('careerpilot_user', JSON.stringify(this.user));
                this.showAppLayout();
                this.showToast(`Logged in as ${data.user.role === 'admin' ? 'Admin' : data.user.name}`, 'success');
                this.navigateTo(data.user.role === 'admin' ? 'admin' : 'dashboard');
                return;
            }
        } catch (e) {
            console.log('Using client fallback for demo login');
        }

        this.user = {
            name: role === 'admin' ? 'Admin' : 'Alex Johnson',
            email: email,
            role: role,
            gender: role === 'admin' ? 'admin' : 'male',
            title: role === 'admin' ? 'System Administrator' : 'Computer Science Senior',
            isLoggedIn: true
        };
        localStorage.setItem('careerpilot_user', JSON.stringify(this.user));
        this.showAppLayout();
        this.showToast(`Logged in as ${role === 'admin' ? 'Admin' : 'Alex Johnson'}`, 'success');
        this.navigateTo(role === 'admin' ? 'admin' : 'dashboard');
    }

    logout() {
        fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
        this.user = null;
        localStorage.removeItem('careerpilot_user');
        localStorage.removeItem('careerpilot_profile');
        document.documentElement.setAttribute('data-user-role', 'jobseeker');

        if (window.profileManager) {
            profileManager.profileData = profileManager.getDefaultData();
            profileManager.render();
        }

        this.showToast('Logged out of session', 'info');
        this.showAuthGateway();
    }

    /* Share Public Profile Modal */
    openPublicProfileModal() {
        const shareModal = document.getElementById('shareModal');
        if (shareModal) {
            shareModal.classList.add('show');
            const qrcodeContainer = document.getElementById('qrcodeContainer');
            if (qrcodeContainer) {
                qrcodeContainer.innerHTML = '';
                new QRCode(qrcodeContainer, {
                    text: window.location.origin + '/profile/alex-johnson',
                    width: 128,
                    height: 128
                });
            }
        }
    }

    closeShareModal() {
        const shareModal = document.getElementById('shareModal');
        if (shareModal) shareModal.classList.remove('show');
    }

    copyShareUrl() {
        const input = document.getElementById('shareUrlInput');
        if (input) {
            navigator.clipboard.writeText(input.value);
            this.showToast('Public profile link copied to clipboard!', 'success');
        }
    }

    togglePublicVisibility(isEnabled) {
        this.showToast(`Public visibility ${isEnabled ? 'ENABLED' : 'DISABLED'}`, 'info');
    }

    /* Notifications Drawer */
    toggleNotifications() {
        const notifDropdown = document.getElementById('notifDropdown');
        if (notifDropdown) notifDropdown.classList.toggle('show');
    }

    renderNotifications() {
        const notifList = document.getElementById('notifList');
        const notifBadge = document.getElementById('notifBadge');
        if (!notifList) return;

        if (notifBadge) notifBadge.textContent = this.notifications.length;
        
        notifList.innerHTML = this.notifications.map(n => `
            <div class="notif-item">
                <i class="fa-solid fa-bell notif-icon"></i>
                <div>
                    <div class="notif-text">${n.text}</div>
                    <span class="notif-time">${n.time}</span>
                </div>
            </div>
        `).join('');
    }

    clearNotifications() {
        this.notifications = [];
        this.renderNotifications();
        this.showToast('Notifications cleared', 'info');
    }

    /* Toast Notification System */
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let icon = 'fa-circle-info';
        if (type === 'success') icon = 'fa-circle-check';
        if (type === 'error') icon = 'fa-triangle-exclamation';

        toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    /* Confetti Particle Celebration Effect */
    triggerConfetti() {
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    }
}

// Global Singleton Instance
const app = new Application();
document.addEventListener('DOMContentLoaded', () => app.init());

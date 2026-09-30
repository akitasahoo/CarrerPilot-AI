/**
 * CareerPilot AI - Admin Panel Controller (adminPanel.js)
 * User management table, metric analytics, and system status controls.
 */

class AdminPanel {
    constructor() {
        this.users = [
            { id: 1, name: 'Alex Johnson', email: 'alex.johnson@email.com', role: 'Candidate', atsScore: 88, interviews: 3, status: 'Active' },
            { id: 2, name: 'Sarah Miller', email: 'sarah.m@univ.edu', role: 'Candidate', atsScore: 92, interviews: 5, status: 'Active' },
            { id: 3, name: 'David Chen', email: 'david.chen@gmail.com', role: 'Candidate', atsScore: 76, interviews: 1, status: 'Active' },
            { id: 4, name: 'Emily Davis', email: 'emily.d@tech.org', role: 'Candidate', atsScore: 84, interviews: 4, status: 'Inactive' },
            { id: 5, name: 'Michael Brown', email: 'michael.b@company.com', role: 'Admin', atsScore: 95, interviews: 12, status: 'Active' }
        ];
    }

    async render() {
        try {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                this.users = data;
            }
        } catch (e) {
            console.log('Using static list for admin users');
        }
        this.renderUserTable(this.users);
    }

    renderUserTable(userList) {
        const tbody = document.getElementById('adminUserTableBody');
        if (!tbody) return;

        tbody.innerHTML = userList.map(u => `
            <tr>
                <td><strong>${u.name}</strong></td>
                <td>${u.email}</td>
                <td><span class="badge ${u.role === 'Admin' ? 'badge-purple' : 'badge-info'}">${u.role}</span></td>
                <td><strong class="text-emerald">${u.atsScore}/100</strong></td>
                <td>${u.interviews} Completed</td>
                <td><span class="badge ${u.status === 'Active' ? 'badge-success' : 'badge-purple'}">${u.status}</span></td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="adminPanel.toggleStatus(${u.id})">
                        ${u.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </button>
                </td>
            </tr>
        `).join('');
    }

    filterUsers() {
        const query = document.getElementById('adminUserSearch').value.toLowerCase();
        const filtered = this.users.filter(u => 
            u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query)
        );
        this.renderUserTable(filtered);
    }

    toggleStatus(userId) {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            user.status = user.status === 'Active' ? 'Inactive' : 'Active';
            this.render();
            app.showToast(`User status updated for ${user.name}`, 'info');
        }
    }
}

const adminPanel = new AdminPanel();

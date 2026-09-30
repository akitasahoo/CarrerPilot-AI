/**
 * CareerPilot AI - Dashboard & Analytics Controller (dashboard.js)
 * Visualizes career readiness index, ATS score history charts, skill radar, and goals.
 */

class Dashboard {
    constructor() {
        this.readinessChart = null;
        this.atsTrendChart = null;
        this.skillRadarChart = null;
        this.goals = [
            { id: 1, text: 'Complete Mock Interview for Senior Full-Stack role', completed: false },
            { id: 2, text: 'Add Docker & CI/CD keywords to ATS Resume', completed: true },
            { id: 3, text: 'Share Public Profile link on LinkedIn', completed: false }
        ];
    }

    render() {
        this.renderCharts();
        this.renderRecommendations();
        this.renderGoals();
        this.renderActivityLog();
    }

    renderCharts() {
        // 1. Readiness Doughnut Chart
        const rCtx = document.getElementById('readinessDoughnutChart');
        if (rCtx) {
            if (this.readinessChart) this.readinessChart.destroy();
            this.readinessChart = new Chart(rCtx, {
                type: 'doughnut',
                data: {
                    datasets: [{
                        data: [84, 16],
                        backgroundColor: ['#4f46e5', 'rgba(255,255,255,0.1)'],
                        borderWidth: 0
                    }]
                },
                options: {
                    cutout: '75%',
                    plugins: { tooltip: { enabled: false } },
                    responsive: true
                }
            });
        }

        // 2. ATS Score Trend Line Chart
        const atsCtx = document.getElementById('atsTrendChart');
        if (atsCtx) {
            if (this.atsTrendChart) this.atsTrendChart.destroy();
            this.atsTrendChart = new Chart(atsCtx, {
                type: 'line',
                data: {
                    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Today'],
                    datasets: [{
                        label: 'ATS Resume Score',
                        data: [68, 74, 80, 82, 88],
                        borderColor: '#059669',
                        backgroundColor: 'rgba(5, 150, 105, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { min: 50, max: 100, grid: { color: 'rgba(255,255,255,0.05)' } },
                        x: { grid: { display: false } }
                    }
                }
            });
        }

        // 3. Skill Radar Chart
        const radarCtx = document.getElementById('skillRadarChart');
        if (radarCtx) {
            if (this.skillRadarChart) this.skillRadarChart.destroy();
            this.skillRadarChart = new Chart(radarCtx, {
                type: 'radar',
                data: {
                    labels: ['Python', 'JavaScript', 'React', 'Flask', 'SQL', 'Algorithms'],
                    datasets: [{
                        label: 'Proficiency Level',
                        data: [90, 88, 85, 82, 78, 80],
                        backgroundColor: 'rgba(2, 132, 199, 0.2)',
                        borderColor: '#0284c7',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { r: { min: 50, max: 100, ticks: { display: false } } },
                    plugins: { legend: { display: false } }
                }
            });
        }
    }

    renderRecommendations() {
        const recBox = document.getElementById('dashRecommendationsList');
        if (!recBox) return;

        recBox.innerHTML = `
            <div class="rec-item">
                <i class="fa-solid fa-wand-magic-sparkles text-amber"></i>
                <span><strong>ATS Keywords:</strong> Add <strong>Docker</strong> and <strong>CI/CD Pipelines</strong> to your Profile Hub to boost recruiter discovery by +18%.</span>
            </div>
            <div class="rec-item">
                <i class="fa-solid fa-headset text-purple"></i>
                <span><strong>Mock Interview:</strong> Practice a <strong>System Design</strong> interview round to elevate your technical confidence score to 90%+.</span>
            </div>
        `;
    }

    renderGoals() {
        const goalBox = document.getElementById('dashGoalsList');
        if (!goalBox) return;

        goalBox.innerHTML = this.goals.map((g, idx) => `
            <div class="goal-item">
                <label class="checkbox-label">
                    <input type="checkbox" ${g.completed ? 'checked' : ''} onchange="dashboard.toggleGoal(${idx})">
                    <span style="${g.completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${g.text}</span>
                </label>
            </div>
        `).join('');
    }

    toggleGoal(idx) {
        this.goals[idx].completed = !this.goals[idx].completed;
        this.renderGoals();
        app.showToast('Goal status updated!', 'success');
    }

    addGoalModal() {
        const title = prompt('Enter new career goal title:');
        if (title && title.trim()) {
            this.goals.push({ id: Date.now(), text: title.trim(), completed: false });
            this.renderGoals();
            app.showToast('New goal added!', 'success');
        }
    }

    renderActivityLog() {
        const actBox = document.getElementById('dashActivityLog');
        if (!actBox) return;

        actBox.innerHTML = `
            <div class="activity-item">
                <i class="fa-solid fa-file-circle-check text-emerald"></i>
                <span>Ran AI ATS Resume Analysis (Score: 88/100)</span>
            </div>
            <div class="activity-item">
                <i class="fa-solid fa-pen-to-square text-blue"></i>
                <span>Updated profile objective and 3 portfolio projects</span>
            </div>
            <div class="activity-item">
                <i class="fa-solid fa-headset text-purple"></i>
                <span>Completed Technical Mock Interview for Software Engineer</span>
            </div>
        `;
    }
}

const dashboard = new Dashboard();
document.addEventListener('DOMContentLoaded', () => dashboard.render());

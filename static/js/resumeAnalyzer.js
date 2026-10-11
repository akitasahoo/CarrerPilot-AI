
/*
 * CareerPilot AI - AI ATS Resume Analyzer
 * Supports PDF, DOCX, TXT and profile-text analysis.
 * Uses the Flask backend and Groq AI for real ATS analysis.
 */

class ResumeAnalyzer {
    constructor() {
        this.radarChart = null;
        this.doughnutChart = null;
    }

    initATSForm() {
        const form = document.getElementById('atsAnalyzerForm');

        if (!form || form.dataset.initialized === 'true') return;

        form.dataset.initialized = 'true';

        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            const fileInput = document.getElementById('atsResumeFile');
            const roleInput = document.getElementById('atsTargetRole');
            const status = document.getElementById('atsAnalysisStatus');
            const output = document.getElementById('atsAnalysisOutput');
            const results = document.getElementById('atsAnalysisResults');
            const button = document.getElementById('atsAnalyzeButton');

            const file = fileInput?.files?.[0];
            const role = roleInput?.value.trim();

            if (!file) {
                if (status) status.textContent = 'Please select a resume file.';
                return;
            }

            if (!role) {
                if (status) status.textContent = 'Please enter a target job role.';
                return;
            }

            const allowedExtensions = ['pdf', 'docx', 'txt'];
            const extension = file.name.split('.').pop().toLowerCase();

            if (!allowedExtensions.includes(extension)) {
                if (status) {
                    status.textContent = 'Please upload a PDF, DOCX or TXT file.';
                }
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                if (status) status.textContent = 'File size must be 5 MB or less.';
                return;
            }

            const formData = new FormData();
            formData.append('resume', file);
            formData.append('targetJobRole', role);

            if (button) button.disabled = true;
            if (status) status.textContent = 'Analyzing resume with AI...';
            if (output) output.textContent = '';
            if (results) results.hidden = true;

            try {
                const response = await fetch('/api/resume/analyze', {
                    method: 'POST',
                    body: formData,
                    credentials: 'same-origin'
                });

                const data = await response.json();

                if (!response.ok || data.success === false) {
                    throw new Error(
                        data.message || 'Resume analysis failed.'
                    );
                }

this.displayATSResult(data, role);

// Hide the raw JSON output
if (output) {
    output.style.display = 'none';
    output.textContent = '';
}

// Show the results container
if (results) {
    results.hidden = true;
}
if (results) {
    results.hidden = false;
    results.style.display = 'block';
}

// Show the dashboard report
const report = document.getElementById('analyzerReportContent');
const emptyState = document.getElementById('analyzerEmptyState');

if (emptyState) emptyState.style.display = 'none';
if (report) report.style.display = 'block';

if (status) {
    status.textContent = 'AI resume analysis completed!';
}


                if (status) status.textContent = 'AI resume analysis completed!';

            } catch (error) {
                console.error('ATS analysis error:', error);

                if (status) {
                    status.textContent =
                        error.message || 'Could not analyze the resume.';
                }

                if (results) results.hidden = true;

                app.showToast(
                    error.message || 'ATS analysis failed.',
                    'error'
                );
            } finally {
                if (button) button.disabled = false;
            }
        });
    }

    handleFileUpload(event) {
        const file = event.target.files?.[0];

        if (!file) return;

        const extension = file.name.split('.').pop().toLowerCase();

        if (!['pdf', 'docx', 'txt'].includes(extension)) {
            app.showToast('Please select a PDF, DOCX or TXT file.', 'error');
            event.target.value = '';
            return;
        }

        // Do not read PDF/DOCX as plain text or fabricate resume content.
        app.showToast(
            `Selected ${file.name}. Submit the ATS upload form to analyze it.`,
            'info'
        );
    }

    loadProfileText() {
        const prof = (
            typeof profileManager !== 'undefined' && profileManager
        ) ? profileManager.profileData : {};

        const text = `
NAME: ${prof.fullName || ''}
EMAIL: ${prof.email || ''}
OBJECTIVE: ${prof.objective || ''}

SKILLS: ${
    Array.isArray(prof.skills) ? prof.skills.join(', ') : ''
}

EXPERIENCE: ${
    Array.isArray(prof.experience)
        ? prof.experience.map(e =>
            [e.role, e.company, e.description].filter(Boolean).join(' ')
        ).join('\n')
        : ''
}

PROJECTS: ${
    Array.isArray(prof.projects)
        ? prof.projects.map(p =>
            [p.title, p.tech, p.description].filter(Boolean).join(' ')
        ).join('\n')
        : ''
}

EDUCATION: ${
    Array.isArray(prof.education)
        ? prof.education.map(e =>
            [e.level, e.degree, e.university, e.institution, e.year]
                .filter(Boolean).join(' ')
        ).join('\n')
        : ''
}
        `.trim();

        const input = document.getElementById('analyzerTextInput');

        if (input) input.value = text;

        app.showToast('Profile text loaded into analyzer.', 'info');
    }

    async analyzeResume() {
        const input = document.getElementById('analyzerTextInput');
        const text = input?.value?.trim() || '';
        const targetRole =
            document.getElementById('targetJobRole')?.value?.trim()
            || document.getElementById('atsTargetRole')?.value?.trim()
            || 'Software Engineer';

        if (text.length < 15) {
            app.showToast(
                'Please enter a resume with sufficient text.',
                'error'
            );
            return;
        }

        app.showToast('Analyzing resume with Groq AI...', 'info');

        try {
            const response = await fetch('/api/resume/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    text,
                    targetJobRole: targetRole
                })
            });

            const data = await response.json();

            if (!response.ok || data.success === false) {
                throw new Error(
                    data.message || 'Resume analysis failed.'
                );
            }

            this.displayATSResult(data, targetRole);

            app.showToast('AI ATS analysis completed!', 'success');

        } catch (error) {
            console.error('ATS analysis error:', error);

            app.showToast(
                error.message || 'Could not analyze resume.',
                'error'
            );
        }
    }

    displayATSResult(data, targetRole) {
        const emptyState = document.getElementById('analyzerEmptyState');
        const report = document.getElementById('analyzerReportContent');

        if (emptyState) emptyState.style.display = 'none';
        if (report) report.style.display = 'block';

        const setText = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        };

        setText('resOverallAtsScore', data.overallScore);
    
// Update Dashboard ATS score after successful analysis
const dashboardScore = document.getElementById('dashAtsScore');

if (dashboardScore) {
    dashboardScore.textContent = `${data.overallScore}/100`;

    const scoreCard = dashboardScore.closest('.stat-value-group')
        ?.parentElement;

    const subtext = scoreCard?.querySelector('.stat-subtext');

    if (subtext) {
        subtext.textContent = 'Latest resume analysis';
    }
}



// Update the Dashboard's Latest ATS Resume Score
const dashboardAtsScore = document.getElementById('dashAtsScore');

if (dashboardAtsScore) {
    dashboardAtsScore.textContent = `${data.overallScore}/100`;
}


        setText(
            'resMatchGrade',
            data.overallScore >= 85
                ? 'Excellent ATS Match'
                : data.overallScore >= 70
                    ? 'Good ATS Match'
                    : data.overallScore >= 50
                        ? 'Moderate ATS Match'
                        : 'Needs Improvement'
        );

        setText(
            'resMatchSummary',
            `Your resume scored ${data.overallScore}/100 for the ${targetRole} role.`
        );

        setText('resFmtScore', `${data.formattingScore}/100`);
        setText('resKeyScore', `${data.keywordScore}/100`);
        setText('resGrammarScore', `${data.grammarScore}/100`);
        setText('resImpactScore', `${data.impactScore}/100`);

        const missingContainer = document.getElementById('resMissingSkills');

        if (missingContainer) {
            missingContainer.replaceChildren();

            (data.missingSkills || []).forEach((skill) => {
                const tag = document.createElement('span');
                tag.className = 'skill-tag';
                tag.style.background = 'rgba(217, 119, 6, 0.15)';
                tag.style.color = '#d97706';
                tag.style.borderColor = 'rgba(217, 119, 6, 0.3)';
                tag.appendChild(document.createTextNode(`+ ${skill} `));

                const addButton = document.createElement('button');
                addButton.type = 'button';
                addButton.textContent = '+';
                addButton.title = `Add ${skill} to profile skills`;
                addButton.addEventListener('click', () => {
                    this.addMissingSkill(skill);
                });

                tag.appendChild(addButton);
                missingContainer.appendChild(tag);
            });
        }

        const suggestionsList = document.getElementById('resSuggestionsList');

        if (suggestionsList) {
            suggestionsList.replaceChildren();

            (data.suggestions || []).forEach((suggestion) => {
                const item = document.createElement('li');
                item.textContent = suggestion;
                suggestionsList.appendChild(item);
            });
        }

        this.renderCharts(data);
    }

    addMissingSkill(skillName) {
        if (
            typeof profileManager !== 'undefined' &&
            profileManager &&
            profileManager.profileData
        ) {
            if (!Array.isArray(profileManager.profileData.skills)) {
                profileManager.profileData.skills = [];
            }

            const skills = profileManager.profileData.skills;

            if (!skills.includes(skillName)) {
                skills.push(skillName);
                profileManager.saveProfile();

                app.showToast(
                    `Added '${skillName}' to your profile skills!`,
                    'success'
                );
            } else {
                app.showToast('This skill is already in your profile.', 'info');
            }
        }
    }

    renderCharts(data) {
        const radarCtx = document.getElementById('analyzerRadarChart');

        if (radarCtx && typeof Chart !== 'undefined') {
            if (this.radarChart) this.radarChart.destroy();

            this.radarChart = new Chart(radarCtx, {
                type: 'radar',
                data: {
                    labels: [
                        'Keywords',
                        'Formatting',
                        'Grammar',
                        'Impact'
                    ],
                    datasets: [{
                        label: 'Resume Score Breakdown',
                        data: [
                            data.keywordScore,
                            data.formattingScore,
                            data.grammarScore,
                            data.impactScore
                        ],
                        backgroundColor: 'rgba(79, 70, 229, 0.25)',
                        borderColor: '#4f46e5',
                        borderWidth: 2,
                        pointBackgroundColor: '#4f46e5'
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        r: {
                            min: 0,
                            max: 100,
                            ticks: { display: false }
                        }
                    }
                }
            });
        }

        const doughnutCtx = document.getElementById('analyzerDoughnutChart');

        if (doughnutCtx && typeof Chart !== 'undefined') {
            if (this.doughnutChart) this.doughnutChart.destroy();

            this.doughnutChart = new Chart(doughnutCtx, {
                type: 'doughnut',
                data: {
                    labels: ['ATS Score', 'Remaining Score'],
                    datasets: [{
                        data: [
                            data.overallScore,
                            100 - data.overallScore
                        ],
                        backgroundColor: ['#059669', '#d97706'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
        }
    }
}

const resumeAnalyzer = new ResumeAnalyzer();


/**
 * CareerPilot AI - Profile Manager Controller (profileManager.js)
 * Handles profile fields, skill taggers, dynamic education & project forms, and completeness tracking.
 */

class ProfileManager {
    constructor() {
        this.profileData = this.getDefaultData();
    }

  getDefaultData(user = null) {

    const isUserAdmin = user && user.role === 'admin';
    const name = user ? (isUserAdmin ? 'Admin' : (user.name || '')) : '';
    const email = user ? (user.email || '') : '';
    const gender = (user ? user.gender : '') || '';

    const avatarPath =
        isUserAdmin
            ? '/static/images/avatar-admin.svg'
            : gender === 'male'
                ? '/static/images/avatar-male.svg'
                : '/static/images/avatar-female.svg';

    return {
        fullName: name,
        email: email,
        gender: gender,
        avatarUrl: avatarPath,

        phone: '',
        location: '',
        linkedin: '',
        github: '',
        website: '',

        headline: '',
        objective: '',

        skills: [],

        education: [],

        projects: [],

        experience: [],

        certifications: '',
        achievements: '',
        languages: '',
        interests: ''
    };
}

    render() {
        this.bindFields();
        this.renderSkills();
        this.renderEducationList();
        this.renderProjectsList();
        this.renderExperienceList();
        this.calculateCompleteness();
    }

    bindFields() {
        document.getElementById('profFullName').value = this.profileData.fullName || '';
        document.getElementById('profEmail').value = this.profileData.email || '';
        document.getElementById('profPhone').value = this.profileData.phone || '';
        document.getElementById('profLocation').value = this.profileData.location || '';
        document.getElementById('profLinkedin').value = this.profileData.linkedin || '';
        document.getElementById('profGithub').value = this.profileData.github || '';
        document.getElementById('profWebsite').value = this.profileData.website || '';
        document.getElementById('profObjective').value = this.profileData.objective || '';
        document.getElementById('profCertifications').value = this.profileData.certifications || '';
        document.getElementById('profAchievements').value = this.profileData.achievements || '';
        document.getElementById('profLanguages').value = this.profileData.languages || '';
        document.getElementById('profInterests').value = this.profileData.interests || '';

        const userGender = (app.user ? app.user.gender : this.profileData.gender) || 'female';
        this.highlightAvatarOption(userGender);
    }

    /* Gender Avatar Preset Selection */
    selectGender(gender) {
        if (app.user && app.user.role === 'admin') return;

        if (app.user) app.user.gender = gender;
        this.profileData.gender = gender;

        this.saveProfile();
        this.highlightAvatarOption(gender);
        if (app.renderUserNav) app.renderUserNav();

        app.showToast(`Avatar preset updated to ${gender === 'female' ? 'Female 👩' : 'Male 👨'} Candidate`, 'success');
    }

    highlightAvatarOption(gender) {
        const optFemale = document.getElementById('avatarOptFemale');
        const optMale = document.getElementById('avatarOptMale');
        const optAdmin = document.getElementById('avatarOptAdmin');

        if (optFemale) optFemale.classList.remove('selected');
        if (optMale) optMale.classList.remove('selected');
        if (optAdmin) optAdmin.classList.remove('selected');

        if (app.user && app.user.role === 'admin') {
            if (optAdmin) optAdmin.classList.add('selected');
        } else if (gender === 'male') {
            if (optMale) optMale.classList.add('selected');
        } else {
            if (optFemale) optFemale.classList.add('selected');
        }
    }

    switchTab(tabId) {
        document.querySelectorAll('.profile-tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.profile-tab-content').forEach(content => content.classList.remove('active'));

        event.target.classList.add('active');
        document.getElementById(`tab-${tabId}`).classList.add('active');
    }

    /* Skill Tags System */
    renderSkills() {
        const container = document.getElementById('skillsTagsContainer');
        if (!container) return;

        container.innerHTML = this.profileData.skills.map((skill, index) => `
            <span class="skill-tag">
                ${skill}
                <i class="fa-solid fa-xmark" onclick="profileManager.removeSkill(${index})"></i>
            </span>
        `).join('');
    }

    addSkillTag() {
        const input = document.getElementById('skillInput');
        const val = input.value.trim();
        if (!val) return;

        const newSkills = val.split(',').map(s => s.trim()).filter(s => s && !this.profileData.skills.includes(s));
        this.profileData.skills.push(...newSkills);
        input.value = '';
        this.renderSkills();
        this.calculateCompleteness();
    }

    removeSkill(index) {
        this.profileData.skills.splice(index, 1);
        this.renderSkills();
        this.calculateCompleteness();
    }

    /* Dynamic Education Fields */
    renderEducationList() {
        const container = document.getElementById('educationListContainer');
        if (!container) return;

        container.innerHTML = this.profileData.education.map((edu, idx) => `
            <div class="dynamic-item-card">
                <button type="button" class="remove-btn" onclick="profileManager.removeEducation(${idx})"><i class="fa-solid fa-trash"></i></button>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Degree / Certificate</label>
                        <input type="text" class="form-control edu-degree" value="${edu.degree || ''}" placeholder="B.S. in Computer Science">
                    </div>
                    <div class="form-group">
                        <label>Institution / University</label>
                        <input type="text" class="form-control edu-institution" value="${edu.institution || ''}" placeholder="University Name">
                    </div>
                    <div class="form-group">
                        <label>CGPA / Score</label>
                        <input type="text" class="form-control edu-cgpa" value="${edu.cgpa || ''}" placeholder="3.8 / 4.0">
                    </div>
                    <div class="form-group">
                        <label>Duration / Period</label>
                        <input type="text" class="form-control edu-duration" value="${edu.duration || ''}" placeholder="2021 - 2025">
                    </div>
                </div>
            </div>
        `).join('');
    }

    addEducationField() {
        this.profileData.education.push({ degree: '', institution: '', cgpa: '', duration: '' });
        this.renderEducationList();
    }

    removeEducation(idx) {
        this.profileData.education.splice(idx, 1);
        this.renderEducationList();
    }

    /* Dynamic Projects Fields */
    renderProjectsList() {
        const container = document.getElementById('projectsListContainer');
        if (!container) return;

        container.innerHTML = this.profileData.projects.map((proj, idx) => `
            <div class="dynamic-item-card">
                <button type="button" class="remove-btn" onclick="profileManager.removeProject(${idx})"><i class="fa-solid fa-trash"></i></button>
                <div class="form-grid">
                    <div class="form-group col-span-2">
                        <label>Project Title</label>
                        <input type="text" class="form-control proj-title" value="${proj.title || ''}" placeholder="Project Name">
                    </div>
                    <div class="form-group col-span-2">
                        <label>Description & Key Features</label>
                        <textarea class="form-control proj-desc" rows="2" placeholder="Brief overview of what you built...">${proj.description || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Technologies Used</label>
                        <input type="text" class="form-control proj-tech" value="${proj.tech || ''}" placeholder="Python, React, SQL">
                    </div>
                    <div class="form-group">
                        <label>GitHub Repository URL</label>
                        <input type="url" class="form-control proj-github" value="${proj.github || ''}" placeholder="https://github.com/user/repo">
                    </div>
                </div>
            </div>
        `).join('');
    }

    addProjectField() {
        this.profileData.projects.push({ title: '', description: '', tech: '', github: '' });
        this.renderProjectsList();
    }

    removeProject(idx) {
        this.profileData.projects.splice(idx, 1);
        this.renderProjectsList();
    }

    /* Dynamic Experience Fields */
    renderExperienceList() {
        const container = document.getElementById('experienceListContainer');
        if (!container) return;

        container.innerHTML = this.profileData.experience.map((exp, idx) => `
            <div class="dynamic-item-card">
                <button type="button" class="remove-btn" onclick="profileManager.removeExperience(${idx})"><i class="fa-solid fa-trash"></i></button>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Job Title / Role</label>
                        <input type="text" class="form-control exp-role" value="${exp.role || ''}" placeholder="Software Engineering Intern">
                    </div>
                    <div class="form-group">
                        <label>Company / Organization</label>
                        <input type="text" class="form-control exp-company" value="${exp.company || ''}" placeholder="Tech Company Inc.">
                    </div>
                    <div class="form-group col-span-2">
                        <label>Duration / Date Range</label>
                        <input type="text" class="form-control exp-duration" value="${exp.duration || ''}" placeholder="Jun 2024 - Present">
                    </div>
                    <div class="form-group col-span-2">
                        <label>Responsibilities & Bullet Points</label>
                        <textarea class="form-control exp-desc" rows="3" placeholder="Bullet points detailing achievements and metrics...">${exp.description || ''}</textarea>
                    </div>
                </div>
            </div>
        `).join('');
    }

    addExperienceField() {
        this.profileData.experience.push({ role: '', company: '', duration: '', description: '' });
        this.renderExperienceList();
    }

    removeExperience(idx) {
        this.profileData.experience.splice(idx, 1);
        this.renderExperienceList();
    }

    /* Collect and Save Profile */
    saveProfile() {
        this.profileData.fullName = document.getElementById('profFullName').value;
        this.profileData.email = document.getElementById('profEmail').value;
        this.profileData.phone = document.getElementById('profPhone').value;
        this.profileData.location = document.getElementById('profLocation').value;
        this.profileData.linkedin = document.getElementById('profLinkedin').value;
        this.profileData.github = document.getElementById('profGithub').value;
        this.profileData.website = document.getElementById('profWebsite').value;
        this.profileData.objective = document.getElementById('profObjective').value;
        this.profileData.certifications = document.getElementById('profCertifications').value;
        this.profileData.achievements = document.getElementById('profAchievements').value;
        this.profileData.languages = document.getElementById('profLanguages').value;
        this.profileData.interests = document.getElementById('profInterests').value;

        // Collect Education
        const eduCards = document.querySelectorAll('#educationListContainer .dynamic-item-card');
        this.profileData.education = Array.from(eduCards).map(card => ({
            degree: card.querySelector('.edu-degree').value,
            institution: card.querySelector('.edu-institution').value,
            cgpa: card.querySelector('.edu-cgpa').value,
            duration: card.querySelector('.edu-duration').value
        }));

        // Collect Projects
        const projCards = document.querySelectorAll('#projectsListContainer .dynamic-item-card');
        this.profileData.projects = Array.from(projCards).map(card => ({
            title: card.querySelector('.proj-title').value,
            description: card.querySelector('.proj-desc').value,
            tech: card.querySelector('.proj-tech').value,
            github: card.querySelector('.proj-github').value
        }));

        // Collect Experience
        const expCards = document.querySelectorAll('#experienceListContainer .dynamic-item-card');
        this.profileData.experience = Array.from(expCards).map(card => ({
            role: card.querySelector('.exp-role').value,
            company: card.querySelector('.exp-company').value,
            duration: card.querySelector('.exp-duration').value,
            description: card.querySelector('.exp-desc').value
        }));

        localStorage.setItem('careerpilot_profile', JSON.stringify(this.profileData));
        this.calculateCompleteness();

        // Sync with backend Flask SQLite database
        fetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.profileData)
        }).then(res => res.json()).then(data => {
            if (data.success) {
                app.showToast('Profile data saved to SQLite database!', 'success');
            }
        }).catch(err => {
            app.showToast('Profile saved to local storage.', 'info');
        });
        
        // Sync with Resume Builder preview & navbar avatar if active
        if (app.renderUserNav) app.renderUserNav();
        if (window.resumeBuilder) {
    resumeBuilder.resumeData = JSON.parse(
        JSON.stringify(this.profileData)
    );

    resumeBuilder.populateEditFields();
    resumeBuilder.renderPreview();
}
    }

    loadDemoData() {
        this.profileData = this.getDefaultData();
        this.saveProfile();
        this.render();
        app.showToast('Loaded demo profile data!', 'info');
    }

    calculateCompleteness() {
        let score = 0;
        if (this.profileData.fullName) score += 15;
        if (this.profileData.objective) score += 15;
        if (this.profileData.skills.length >= 5) score += 20;
        if (this.profileData.education.length >= 1) score += 15;
        if (this.profileData.projects.length >= 1) score += 15;
        if (this.profileData.experience.length >= 1) score += 10;
        if (this.profileData.certifications) score += 10;

        score = Math.min(100, score);

        const percentEl = document.getElementById('profileCompletenessPercent');
        const fillEl = document.getElementById('profileCompletenessFill');
        if (percentEl) percentEl.textContent = `${score}%`;
        if (fillEl) fillEl.style.width = `${score}%`;

        // Update sidebar score
        const sidebarScore = document.getElementById('sidebarReadinessScore');
        const sidebarFill = document.getElementById('sidebarReadinessFill');
        if (sidebarScore) sidebarScore.textContent = `${score}%`;
        if (sidebarFill) sidebarFill.style.width = `${score}%`;
    }
}

const profileManager = new ProfileManager();
document.addEventListener('DOMContentLoaded', () => profileManager.render());

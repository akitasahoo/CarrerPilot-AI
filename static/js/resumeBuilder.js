/**
 * CareerPilot AI - AI Resume Builder & PDF Exporter (resumeBuilder.js)
 * Standalone direct resume content editor isolated from Profile Hub,
 * supporting 4 distinct modern ATS templates, color/font customizers, and PDF export.
 */

class ResumeBuilder {
    constructor() {
        this.selectedTemplate = 'modern';
        this.accentColor = '#4f46e5';
        this.fontFamily = "'Inter', sans-serif";
        this.resumeData = null;
        this.activeControlTab = 'design';
    }

    initResumeData() {
        if (!this.resumeData && window.profileManager) {
            this.syncFromProfile();
        }
    }

    syncFromProfile() {
        const source = profileManager ? profileManager.profileData : {};
        this.resumeData = JSON.parse(JSON.stringify(source));
        this.populateEditFields();
        this.renderPreview();
        if (app && app.showToast) app.showToast('Resume content loaded from Profile Hub!', 'info');
    }

    populateEditFields() {
        if (!this.resumeData) return;
        const d = this.resumeData;

        const nameEl = document.getElementById('resEditName');
        const headEl = document.getElementById('resEditHeadline');
        const emailEl = document.getElementById('resEditEmail');
        const phoneEl = document.getElementById('resEditPhone');
        const locEl = document.getElementById('resEditLocation');
        const sumEl = document.getElementById('resEditSummary');
        const skillsEl = document.getElementById('resEditSkills');

        if (nameEl) nameEl.value = d.fullName || '';
        if (headEl) headEl.value = d.headline || '';
        if (emailEl) emailEl.value = d.email || '';
        if (phoneEl) phoneEl.value = d.phone || '';
        if (locEl) locEl.value = d.location || '';
        if (sumEl) sumEl.value = d.objective || '';
        if (skillsEl) skillsEl.value = (d.skills || []).join(', ');
    }

    updateResumeField(field, value) {
        this.initResumeData();
        this.resumeData[field] = value;
        this.renderPreview();
    }

    updateResumeSkills(skillsCsv) {
        this.initResumeData();
        this.resumeData.skills = skillsCsv.split(',').map(s => s.trim()).filter(Boolean);
        this.renderPreview();
    }

async generateWithAI() {

    this.initResumeData();

    // Get current profile data
    const profile =
        (profileManager && profileManager.profileData)
            ? profileManager.profileData
            : {};

    // User must have a profile
    if (!profile.fullName && !profile.email) {
        if (app && app.showToast) {
            app.showToast(
                'Please complete and save your profile first.',
                'error'
            );
        }
        return;
    }

    const targetRoleInput =
        document.getElementById('aiGenTargetRole');

    const expLevelSelect =
        document.getElementById('aiGenExpLevel');

    const targetRole =
        targetRoleInput
            ? targetRoleInput.value.trim()
            : '';

    const expLevel =
        expLevelSelect
            ? expLevelSelect.value
            : '';

    if (!targetRole) {

        if (app && app.showToast) {
            app.showToast(
                'Please enter a target job role.',
                'error'
            );
        }

        return;
    }

    if (app && app.showToast) {
        app.showToast(
            'AI is optimizing your real profile for ' +
            targetRole + '...',
            'info'
        );
    }

    try {

        const response = await fetch(
            '/api/resume/generate',
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({

                    targetRole: targetRole,

                    experienceLevel: expLevel,

                    profile: profile
                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success || !data.resume) {

            throw new Error(
                data.message ||
                'AI resume generation failed.'
            );
        }

        // Keep user's real personal information
        const generatedResume = data.resume;

        this.resumeData = {

            ...profile,

            ...generatedResume,

            fullName: profile.fullName || '',
            email: profile.email || '',
            gender: profile.gender || '',
            phone: profile.phone || '',
            location: profile.location || '',
            linkedin: profile.linkedin || '',
            github: profile.github || '',
            website: profile.website || ''
        };

        // Never allow AI to invent these sections
        this.resumeData.experience =
            Array.isArray(profile.experience)
                ? profile.experience
                : [];

        this.resumeData.education =
            Array.isArray(profile.education)
                ? profile.education
                : [];

        this.resumeData.projects =
            Array.isArray(profile.projects)
                ? profile.projects
                : [];

        this.populateEditFields();

        this.renderPreview();

        if (app && app.triggerConfetti) {
            app.triggerConfetti();
        }

        if (app && app.showToast) {
            app.showToast(
                'AI Resume optimized successfully!',
                'success'
            );
        }

    } catch (error) {

        console.error(
            'AI Resume Generation Error:',
            error
        );

        if (app && app.showToast) {
            app.showToast(
                'AI could not generate the resume. Please try again.',
                'error'
            );
        }
    }
}


    switchControlTab(tabName) {
        this.activeControlTab = tabName;
        const aiBtn = document.getElementById('builderTabAiBtn');
        const designBtn = document.getElementById('builderTabDesignBtn');
        const editBtn = document.getElementById('builderTabEditBtn');

        const aiPane = document.getElementById('builderPaneAi');
        const designPane = document.getElementById('builderPaneDesign');
        const editPane = document.getElementById('builderPaneEdit');

        [aiBtn, designBtn, editBtn].forEach(b => { if (b) b.classList.remove('active'); });
        [aiPane, designPane, editPane].forEach(p => { if (p) p.style.display = 'none'; });

        if (tabName === 'ai') {
            if (aiBtn) aiBtn.classList.add('active');
            if (aiPane) aiPane.style.display = 'block';
        } else if (tabName === 'design') {
            if (designBtn) designBtn.classList.add('active');
            if (designPane) designPane.style.display = 'block';
        } else {
            if (editBtn) editBtn.classList.add('active');
            if (editPane) editPane.style.display = 'block';
            this.populateEditFields();
        }
    }

    selectTemplate(templateName) {
        this.selectedTemplate = templateName;
        document.querySelectorAll('.template-option').forEach(opt => {
            opt.classList.remove('active');
            if (opt.getAttribute('data-template') === templateName) {
                opt.classList.add('active');
            }
        });
        this.renderPreview();
        if (app && app.showToast) app.showToast(`Switched to Template ${templateName.toUpperCase()}`, 'info');
    }

    setColor(colorHex) {
        this.accentColor = colorHex;
        document.querySelectorAll('.color-dot').forEach(dot => {
            dot.classList.remove('active');
            if (dot.style.background === colorHex || dot.style.backgroundColor === colorHex) {
                dot.classList.add('active');
            }
        });
        this.renderPreview();
    }

    setFont(fontValue) {
        this.fontFamily = fontValue;
        this.renderPreview();
    }

    renderPreview() {
        const paper = document.getElementById('resumePaper');
        if (!paper) return;

        this.initResumeData();
        const data = this.resumeData || (profileManager ? profileManager.profileData : {});
        paper.style.fontFamily = this.fontFamily;
        paper.style.setProperty('--resume-accent', this.accentColor);

        const showSummary = document.getElementById('toggleSummary')?.checked ?? true;
        const showEdu = document.getElementById('toggleEducation')?.checked ?? true;
        const showSkills = document.getElementById('toggleSkills')?.checked ?? true;
        const showProjects = document.getElementById('toggleProjects')?.checked ?? true;
        const showExp = document.getElementById('toggleExperience')?.checked ?? true;
        const showCerts = document.getElementById('toggleCerts')?.checked ?? true;
        const fullName = data.fullName || '';
        const headline = data.headline || '';
        const email = data.email || '';
        const phone = data.phone || '';
        const location = data.location || '';
        const objective = data.objective || '';
        const skills = data.skills || [];
        const experience = data.experience || [];
        const projects = data.projects || [];
        const education = data.education || [];

        // ================= TEMPLATE 1: TECH MODERN =================
        if (this.selectedTemplate === 'modern') {
            paper.className = 'resume-paper-container resume-template-modern';
            paper.innerHTML = `
                <header style="border-bottom: 2.5px solid ${this.accentColor}; padding-bottom: 14px; margin-bottom: 16px;">
                    <h1 style="color: ${this.accentColor}; font-size: 22pt; font-weight: 800; margin-bottom: 2px;">${fullName}</h1>
                    <div style="font-size: 11pt; color: #475569; font-weight: 600; margin-bottom: 8px;">${headline}</div>
                    <div style="font-size: 9pt; color: #334155; display: flex; gap: 14px; flex-wrap: wrap;">
                        <span><i class="fa-solid fa-envelope"></i> ${email}</span>
                        <span><i class="fa-solid fa-phone"></i> ${phone}</span>
                        <span><i class="fa-solid fa-location-dot"></i> ${location}</span>
                    </div>
                </header>

                ${showSummary ? `
                    <section style="margin-bottom: 14px;">
                        <h2 style="color: ${this.accentColor}; font-size: 11.5pt; font-weight: 700; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin-bottom: 6px; text-transform: uppercase;">Executive Summary</h2>
                        <p style="font-size: 9.5pt; color: #334155; line-height: 1.5;">${objective}</p>
                    </section>
                ` : ''}

                ${showSkills ? `
                    <section style="margin-bottom: 14px;">
                        <h2 style="color: ${this.accentColor}; font-size: 11.5pt; font-weight: 700; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin-bottom: 8px; text-transform: uppercase;">Technical Skills</h2>
                        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                            ${skills.map(s => `<span style="background: rgba(79, 70, 229, 0.08); border: 1px solid ${this.accentColor}33; color: ${this.accentColor}; font-size: 8.5pt; padding: 2px 8px; border-radius: 4px; font-weight: 600;">${s}</span>`).join('')}
                        </div>
                    </section>
                ` : ''}

                ${showExp ? `
                    <section style="margin-bottom: 14px;">
                        <h2 style="color: ${this.accentColor}; font-size: 11.5pt; font-weight: 700; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin-bottom: 8px; text-transform: uppercase;">Work Experience</h2>
                        ${experience.map(e => `
                            <div style="margin-bottom: 10px;">
                                <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 10pt; color: #0f172a;">
                                    <span>${e.role} — <span style="color: ${this.accentColor};">${e.company}</span></span>
                                    <span style="color: #64748b; font-size: 9pt; font-weight: 400;">${e.duration}</span>
                                </div>
                                <p style="font-size: 9.5pt; color: #334155; margin-top: 2px;">${e.description}</p>
                            </div>
                        `).join('')}
                    </section>
                ` : ''}

                ${showProjects ? `
                    <section style="margin-bottom: 14px;">
                        <h2 style="color: ${this.accentColor}; font-size: 11.5pt; font-weight: 700; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin-bottom: 8px; text-transform: uppercase;">Key Projects</h2>
                        ${projects.map(p => `
                            <div style="margin-bottom: 8px;">
                                <div style="font-weight: 700; font-size: 10pt; color: #0f172a;">${p.title} <span style="font-weight: 400; font-size: 8.5pt; color: #64748b;">(${p.tech})</span></div>
                                <p style="font-size: 9.5pt; color: #334155;">${p.description}</p>
                            </div>
                        `).join('')}
                    </section>
                ` : ''}

                ${showEdu ? `
                    <section style="margin-bottom: 14px;">
                        <h2 style="color: ${this.accentColor}; font-size: 11.5pt; font-weight: 700; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin-bottom: 6px; text-transform: uppercase;">Education</h2>
                        ${education.map(ed => `
                            <div style="display: flex; justify-content: space-between; font-size: 9.5pt; margin-bottom: 4px;">
                                <span><strong>${ed.degree}</strong>, ${ed.institution}</span>
                                <span style="color: #64748b;">${ed.duration} (CGPA: ${ed.cgpa})</span>
                            </div>
                        `).join('')}
                    </section>
                ` : ''}
            `;
        } 
        // ================= TEMPLATE 2: EXECUTIVE MINIMALIST =================
        else if (this.selectedTemplate === 'executive') {
            paper.className = 'resume-paper-container resume-template-executive';
            paper.innerHTML = `
                <div style="text-align: center; border-bottom: 1.5px solid #0f172a; padding-bottom: 12px; margin-bottom: 18px;">
                    <h1 style="font-size: 20pt; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">${fullName}</h1>
                    <div style="font-size: 10pt; color: #475569; letter-spacing: 0.5px; margin-bottom: 6px;">${headline}</div>
                    <div style="font-size: 9pt; color: #475569;">
                        ${email} &nbsp;|&nbsp; ${phone} &nbsp;|&nbsp; ${location}
                    </div>
                </div>

                ${showSummary ? `
                    <section style="margin-bottom: 16px;">
                        <h3 style="border-bottom: 1px solid #0f172a; font-size: 10.5pt; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px; color: #0f172a;">PROFILE OBJECTIVE</h3>
                        <p style="font-size: 9.5pt; color: #334155; font-style: italic; line-height: 1.5;">${objective}</p>
                    </section>
                ` : ''}

                ${showSkills ? `
                    <section style="margin-bottom: 16px;">
                        <h3 style="border-bottom: 1px solid #0f172a; font-size: 10.5pt; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px; color: #0f172a;">CORE COMPETENCIES</h3>
                        <p style="font-size: 9.5pt; color: #1e293b;">${skills.join('  •  ')}</p>
                    </section>
                ` : ''}

                ${showExp ? `
                    <section style="margin-bottom: 16px;">
                        <h3 style="border-bottom: 1px solid #0f172a; font-size: 10.5pt; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; color: #0f172a;">PROFESSIONAL EXPERIENCE</h3>
                        ${experience.map(e => `
                            <div style="margin-bottom: 10px;">
                                <div style="display: flex; justify-content: space-between; font-size: 10pt;">
                                    <strong style="color: #0f172a;">${e.company}</strong>
                                    <span style="font-size: 9pt; font-style: italic; color: #475569;">${e.duration}</span>
                                </div>
                                <div style="font-size: 9.5pt; font-style: italic; color: #475569; margin-bottom: 2px;">${e.role}</div>
                                <p style="font-size: 9.5pt; color: #334155;">${e.description}</p>
                            </div>
                        `).join('')}
                    </section>
                ` : ''}

                ${showProjects ? `
                    <section style="margin-bottom: 16px;">
                        <h3 style="border-bottom: 1px solid #0f172a; font-size: 10.5pt; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; color: #0f172a;">KEY PROJECTS</h3>
                        ${projects.map(p => `
                            <div style="margin-bottom: 8px;">
                                <div style="font-size: 10pt; font-weight: 700; color: #0f172a;">${p.title} <span style="font-weight: 400; font-size: 8.5pt; color: #64748b;">(${p.tech})</span></div>
                                <p style="font-size: 9.5pt; color: #334155;">${p.description}</p>
                            </div>
                        `).join('')}
                    </section>
                ` : ''}

                ${showEdu ? `
                    <section style="margin-bottom: 16px;">
                        <h3 style="border-bottom: 1px solid #0f172a; font-size: 10.5pt; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px; color: #0f172a;">EDUCATION & ACADEMICS</h3>
                        ${education.map(ed => `
                            <div style="display: flex; justify-content: space-between; font-size: 9.5pt;">
                                <span><strong>${ed.degree}</strong> &nbsp;—&nbsp; ${ed.institution}</span>
                                <span style="font-style: italic; color: #475569;">${ed.duration}</span>
                            </div>
                        `).join('')}
                    </section>
                ` : ''}
            `;
        }
        // ================= TEMPLATE 3: CREATIVE DARK BANNER =================
        else if (this.selectedTemplate === 'creative') {
            paper.className = 'resume-paper-container resume-template-creative';
            paper.innerHTML = `
                <div style="background: linear-gradient(135deg, #0f172a 0%, ${this.accentColor} 100%); color: #ffffff; padding: 22px 24px; border-radius: 6px; margin-bottom: 18px;">
                    <h1 style="font-size: 22pt; font-weight: 800; color: #ffffff; margin-bottom: 2px;">${fullName}</h1>
                    <div style="font-size: 11pt; color: rgba(255,255,255,0.85); font-weight: 500; margin-bottom: 12px;">${headline}</div>
                    <div style="font-size: 9pt; color: rgba(255,255,255,0.9); display: flex; gap: 14px; flex-wrap: wrap;">
                        <span><i class="fa-solid fa-envelope"></i> ${email}</span>
                        <span><i class="fa-solid fa-phone"></i> ${phone}</span>
                        <span><i class="fa-solid fa-location-dot"></i> ${location}</span>
                    </div>
                </div>

                ${showSummary ? `
                    <section style="margin-bottom: 16px;">
                        <h2 style="color: ${this.accentColor}; font-size: 12pt; font-weight: 700; margin-bottom: 6px;">About Me</h2>
                        <p style="font-size: 9.5pt; color: #334155; line-height: 1.5;">${objective}</p>
                    </section>
                ` : ''}

                ${showExp ? `
                    <section style="margin-bottom: 16px;">
                        <h2 style="color: ${this.accentColor}; font-size: 12pt; font-weight: 700; margin-bottom: 8px;">Experience Timeline</h2>
                        ${experience.map(e => `
                            <div style="border-left: 3px solid ${this.accentColor}; padding-left: 12px; margin-bottom: 10px;">
                                <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 10pt; color: #0f172a;">
                                    <span>${e.role} @ <span style="color: ${this.accentColor};">${e.company}</span></span>
                                    <span style="color: #64748b; font-size: 8.5pt;">${e.duration}</span>
                                </div>
                                <p style="font-size: 9.5pt; color: #334155; margin-top: 2px;">${e.description}</p>
                            </div>
                        `).join('')}
                    </section>
                ` : ''}

                ${showProjects ? `
                    <section style="margin-bottom: 16px;">
                        <h2 style="color: ${this.accentColor}; font-size: 12pt; font-weight: 700; margin-bottom: 8px;">Highlighted Projects</h2>
                        ${projects.map(p => `
                            <div style="border-left: 3px solid #0f172a; padding-left: 12px; margin-bottom: 8px;">
                                <div style="font-weight: 700; font-size: 10pt; color: #0f172a;">${p.title} <span style="font-weight: 400; font-size: 8.5pt; color: #64748b;">(${p.tech})</span></div>
                                <p style="font-size: 9.5pt; color: #334155;">${p.description}</p>
                            </div>
                        `).join('')}
                    </section>
                ` : ''}

                ${showSkills ? `
                    <section style="margin-bottom: 16px;">
                        <h2 style="color: ${this.accentColor}; font-size: 12pt; font-weight: 700; margin-bottom: 8px;">Skills & Technologies</h2>
                        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                            ${skills.map(s => `<span style="background: #f1f5f9; color: #0f172a; font-size: 8.5pt; padding: 3px 10px; border-radius: 12px; font-weight: 600; border: 1px solid #cbd5e1;">${s}</span>`).join('')}
                        </div>
                    </section>
                ` : ''}

                ${showEdu ? `
                    <section style="margin-bottom: 16px;">
                        <h2 style="color: ${this.accentColor}; font-size: 12pt; font-weight: 700; margin-bottom: 6px;">Education</h2>
                        ${education.map(ed => `
                            <div style="font-size: 9.5pt; color: #334155;">
                                <strong>${ed.degree}</strong> — ${ed.institution} (${ed.duration})
                            </div>
                        `).join('')}
                    </section>
                ` : ''}
            `;
        }
        // ================= TEMPLATE 4: TWO-COLUMN COMPACT CORPORATE =================
        else if (this.selectedTemplate === 'compact') {
            paper.className = 'resume-paper-container resume-template-compact';
            paper.innerHTML = `
                <div style="display: flex; gap: 20px;">
                    <!-- LEFT COLUMN (32%) -->
                    <div style="width: 32%; background: #f8fafc; padding: 16px; border-radius: 6px; border-right: 1px solid #e2e8f0;">
                        <div style="margin-bottom: 16px;">
                            <img src="${(app.user && app.user.gender === 'male') ? '/static/images/avatar-male.svg' : '/static/images/avatar-female.svg'}" style="width: 64px; height: 64px; border-radius: 50%; border: 2px solid ${this.accentColor}; display: block; margin-bottom: 8px;" alt="Avatar">
                            <h2 style="font-size: 13pt; font-weight: 800; color: #0f172a; line-height: 1.2;">${fullName}</h2>
                            <div style="font-size: 8.5pt; color: ${this.accentColor}; font-weight: 600;">${headline}</div>
                        </div>

                        <div style="margin-bottom: 16px; font-size: 8.5pt; color: #475569; display: flex; flex-direction: column; gap: 6px;">
                            <strong style="color: #0f172a; font-size: 9pt; border-bottom: 1px solid #cbd5e1; padding-bottom: 2px;">CONTACT</strong>
                            <span><i class="fa-solid fa-envelope"></i> ${email}</span>
                            <span><i class="fa-solid fa-phone"></i> ${phone}</span>
                            <span><i class="fa-solid fa-location-dot"></i> ${location}</span>
                        </div>

                        ${showSkills ? `
                            <div style="margin-bottom: 16px;">
                                <strong style="color: #0f172a; font-size: 9pt; border-bottom: 1px solid #cbd5e1; padding-bottom: 2px; display: block; margin-bottom: 6px;">SKILLS</strong>
                                <div style="display: flex; flex-direction: column; gap: 4px; font-size: 8.5pt; color: #334155;">
                                    ${skills.map(s => `<span>• ${s}</span>`).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${showEdu ? `
                            <div style="margin-bottom: 16px;">
                                <strong style="color: #0f172a; font-size: 9pt; border-bottom: 1px solid #cbd5e1; padding-bottom: 2px; display: block; margin-bottom: 6px;">EDUCATION</strong>
                                ${education.map(ed => `
                                    <div style="font-size: 8.5pt; margin-bottom: 6px;">
                                        <strong style="color: #0f172a; display: block;">${ed.degree}</strong>
                                        <span style="color: #64748b;">${ed.institution} (${ed.duration})</span>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>

                    <!-- RIGHT COLUMN (68%) -->
                    <div style="width: 68%;">
                        ${showSummary ? `
                            <section style="margin-bottom: 14px;">
                                <h3 style="color: ${this.accentColor}; font-size: 11pt; font-weight: 700; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin-bottom: 6px; text-transform: uppercase;">Executive Profile</h3>
                                <p style="font-size: 9pt; color: #334155; line-height: 1.4;">${objective}</p>
                            </section>
                        ` : ''}

                        ${showExp ? `
                            <section style="margin-bottom: 14px;">
                                <h3 style="color: ${this.accentColor}; font-size: 11pt; font-weight: 700; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin-bottom: 8px; text-transform: uppercase;">Work Experience</h3>
                                ${experience.map(e => `
                                    <div style="margin-bottom: 10px;">
                                        <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 9.5pt; color: #0f172a;">
                                            <span>${e.role} — ${e.company}</span>
                                            <span style="color: #64748b; font-size: 8.5pt; font-weight: 400;">${e.duration}</span>
                                        </div>
                                        <p style="font-size: 9pt; color: #334155; margin-top: 2px;">${e.description}</p>
                                    </div>
                                `).join('')}
                            </section>
                        ` : ''}

                        ${showProjects ? `
                            <section style="margin-bottom: 14px;">
                                <h3 style="color: ${this.accentColor}; font-size: 11pt; font-weight: 700; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin-bottom: 8px; text-transform: uppercase;">Projects</h3>
                                ${projects.map(p => `
                                    <div style="margin-bottom: 8px;">
                                        <div style="font-weight: 700; font-size: 9.5pt; color: #0f172a;">${p.title} <span style="font-weight: 400; font-size: 8pt; color: #64748b;">(${p.tech})</span></div>
                                        <p style="font-size: 9pt; color: #334155;">${p.description}</p>
                                    </div>
                                `).join('')}
                            </section>
                        ` : ''}
                    </div>
                </div>
            `;
        }
    }

    async enhanceWithAI() {
        app.showToast('AI is optimizing action verbs and inserting high-ranking ATS keywords...', 'info');

        let enhancedText = "Results-driven Software Engineer with demonstrated mastery in Python Flask, React, and REST API microservices. Accelerated database query performance by 35% and built scalable cloud applications adhering to modern ATS standards.";
        
        try {
            const currentObjective = this.resumeData?.objective || profileManager?.profileData?.objective || '';
            const res = await fetch('/api/resume/enhance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bulletPoint: currentObjective, role: 'Software Engineer' })
            });
            const data = await res.json();
            if (data.success && data.enhancedBullet) {
                enhancedText = data.enhancedBullet;
            }
        } catch (e) {
            console.log('Using client fallback AI bullet enhancer');
        }

        this.initResumeData();
        this.resumeData.objective = enhancedText;
        this.populateEditFields();
        this.renderPreview();
        
        if (app && app.triggerConfetti) app.triggerConfetti();
        app.showToast('AI Enhancement applied to Resume Draft!', 'success');
    }

    printResume() {
        window.print();
    }

    exportPDF() {
        const element = document.getElementById('resumePaper');
        if (!element) return;

        app.showToast('Generating high-resolution PDF download...', 'info');

        const fullName = (this.resumeData?.fullName || 'Candidate').replace(/\s+/g, '_');
        const opt = {
            margin: 0,
            filename: `${fullName}_Resume.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        if (typeof html2pdf === 'function') {
            html2pdf().set(opt).from(element).save().then(() => {
                app.showToast('PDF Resume downloaded successfully!', 'success');
            });
        } else {
            window.print();
        }
    }
}

// Global Singleton Instance
const resumeBuilder = new ResumeBuilder();


class ResumeBuilder {

    constructor() {

        this.selectedTemplate = 'modern';

        this.accentColor = '#4f46e5';

        this.fontFamily = "'Inter', sans-serif";

        this.resumeData = null;

        this.activeControlTab = 'design';
    }


    // ==========================================
    // INITIALIZE RESUME DATA
    // ==========================================

    initResumeData() {

        if (!this.resumeData && window.profileManager) {

            this.syncFromProfile();

        }
    }


    // ==========================================
    // SYNC PROFILE → RESUME
    // ==========================================

    syncFromProfile() {

        const source =
            window.profileManager
                ? window.profileManager.profileData
                : {};

        this.resumeData =
            JSON.parse(JSON.stringify(source || {}));

        // Make sure arrays always exist

        this.resumeData.skills =
            Array.isArray(this.resumeData.skills)
                ? this.resumeData.skills
                : [];

        this.resumeData.education =
            Array.isArray(this.resumeData.education)
                ? this.resumeData.education
                : [];

        this.resumeData.projects =
            Array.isArray(this.resumeData.projects)
                ? this.resumeData.projects
                : [];

        this.resumeData.experience =
            Array.isArray(this.resumeData.experience)
                ? this.resumeData.experience
                : [];

        this.populateEditFields();

        this.renderPreview();

        if (window.app && app.showToast) {

            app.showToast(
                'Resume content loaded from Profile Hub!',
                'info'
            );
        }
    }


    // ==========================================
    // POPULATE EDIT FIELDS
    // ==========================================

    populateEditFields() {

        if (!this.resumeData) return;

        const d = this.resumeData;

        const nameEl =
            document.getElementById('resEditName');

        const headEl =
            document.getElementById('resEditHeadline');

        const emailEl =
            document.getElementById('resEditEmail');

        const phoneEl =
            document.getElementById('resEditPhone');

        const locEl =
            document.getElementById('resEditLocation');

        const sumEl =
            document.getElementById('resEditSummary');

        const skillsEl =
            document.getElementById('resEditSkills');


        if (nameEl)
            nameEl.value = d.fullName || '';


        if (headEl)
            headEl.value = d.headline || '';


        if (emailEl)
            emailEl.value = d.email || '';


        if (phoneEl)
            phoneEl.value = d.phone || '';


        if (locEl)
            locEl.value = d.location || '';


        if (sumEl)
            sumEl.value = d.objective || '';


        if (skillsEl) {

            skillsEl.value =
                Array.isArray(d.skills)
                    ? d.skills.join(', ')
                    : '';
        }
    }


    // ==========================================
    // UPDATE SINGLE RESUME FIELD
    // ==========================================

    updateResumeField(field, value) {

        this.initResumeData();

        if (!this.resumeData) return;

        this.resumeData[field] = value;

        this.renderPreview();
    }


    // ==========================================
    // UPDATE SKILLS
    // ==========================================

    updateResumeSkills(skillsCsv) {

        this.initResumeData();

        if (!this.resumeData) return;

        this.resumeData.skills =
            skillsCsv
                .split(',')
                .map(s => s.trim())
                .filter(Boolean);

        this.renderPreview();
    }


    // ==========================================
    // AI RESUME GENERATION
    // ==========================================

    async generateWithAI() {

        this.initResumeData();

        const profile =
            (
                window.profileManager &&
                window.profileManager.profileData
            )
                ? window.profileManager.profileData
                : {};


        // --------------------------------------
        // PROFILE CHECK
        // --------------------------------------

        if (!profile.fullName && !profile.email) {

            if (window.app && app.showToast) {

                app.showToast(
                    'Please complete and save your profile first.',
                    'error'
                );
            }

            return;
        }


        // --------------------------------------
        // TARGET ROLE
        // --------------------------------------

        const targetRoleInput =
            document.getElementById(
                'aiGenTargetRole'
            );

        const expLevelSelect =
            document.getElementById(
                'aiGenExpLevel'
            );


        const targetRole =
            targetRoleInput
                ? targetRoleInput.value.trim()
                : '';


        const expLevel =
            expLevelSelect
                ? expLevelSelect.value
                : '';


        if (!targetRole) {

            if (window.app && app.showToast) {

                app.showToast(
                    'Please enter a target job role.',
                    'error'
                );
            }

            return;
        }


        if (window.app && app.showToast) {

            app.showToast(
                'AI is optimizing your real profile for ' +
                targetRole +
                '...',
                'info'
            );
        }


        try {

            const response =
                await fetch(
                    '/api/resume/generate',
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body: JSON.stringify({

                            targetRole:
                                targetRole,

                            experienceLevel:
                                expLevel,

                            profile:
                                profile
                        })
                    }
                );


            const data =
                await response.json();


            if (
                !response.ok ||
                !data.success ||
                !data.resume
            ) {

                throw new Error(
                    data.message ||
                    'AI resume generation failed.'
                );
            }


            // --------------------------------------
            // GENERATED RESUME
            // --------------------------------------

            const generatedResume =
                data.resume || {};


            /*
             * AI may improve:
             * - headline
             * - objective
             * - skills
             *
             * But user's real personal information
             * must remain unchanged.
             */

            this.resumeData = {

                ...profile,

                ...generatedResume,

                // REAL USER DATA
                fullName:
                    profile.fullName || '',

                email:
                    profile.email || '',

                gender:
                    profile.gender || '',

                phone:
                    profile.phone || '',

                location:
                    profile.location || '',

                linkedin:
                    profile.linkedin || '',

                github:
                    profile.github || '',

                website:
                    profile.website || '',

                avatarUrl:
                    profile.avatarUrl || ''
            };


            // --------------------------------------
            // NEVER ALLOW AI TO INVENT THESE
            // --------------------------------------

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


            // --------------------------------------
            // SKILLS
            // --------------------------------------

            if (
                !Array.isArray(
                    this.resumeData.skills
                )
            ) {

                this.resumeData.skills =
                    Array.isArray(profile.skills)
                        ? profile.skills
                        : [];
            }


            this.populateEditFields();

            this.renderPreview();


            if (
                window.app &&
                app.triggerConfetti
            ) {

                app.triggerConfetti();
            }


            if (
                window.app &&
                app.showToast
            ) {

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


            if (
                window.app &&
                app.showToast
            ) {

                app.showToast(
                    'AI could not generate the resume. Please try again.',
                    'error'
                );
            }
        }
    }


    // ==========================================
    // CONTROL TABS
    // ==========================================

    switchControlTab(tabName) {

        this.activeControlTab = tabName;


        const aiBtn =
            document.getElementById(
                'builderTabAiBtn'
            );

        const designBtn =
            document.getElementById(
                'builderTabDesignBtn'
            );

        const editBtn =
            document.getElementById(
                'builderTabEditBtn'
            );


        const aiPane =
            document.getElementById(
                'builderPaneAi'
            );

        const designPane =
            document.getElementById(
                'builderPaneDesign'
            );

        const editPane =
            document.getElementById(
                'builderPaneEdit'
            );


        [
            aiBtn,
            designBtn,
            editBtn
        ].forEach(button => {

            if (button) {

                button.classList.remove(
                    'active'
                );
            }
        });


        [
            aiPane,
            designPane,
            editPane
        ].forEach(pane => {

            if (pane) {

                pane.style.display =
                    'none';
            }
        });


        if (tabName === 'ai') {

            if (aiBtn)
                aiBtn.classList.add('active');

            if (aiPane)
                aiPane.style.display = 'block';

        } else if (tabName === 'design') {

            if (designBtn)
                designBtn.classList.add('active');

            if (designPane)
                designPane.style.display =
                    'block';

        } else {

            if (editBtn)
                editBtn.classList.add('active');

            if (editPane)
                editPane.style.display =
                    'block';

            this.populateEditFields();
        }
    }


    // ==========================================
    // TEMPLATE
    // ==========================================

    selectTemplate(templateName) {

        this.selectedTemplate =
            templateName;


        document
            .querySelectorAll(
                '.template-option'
            )
            .forEach(option => {

                option.classList.remove(
                    'active'
                );


                if (
                    option.getAttribute(
                        'data-template'
                    ) === templateName
                ) {

                    option.classList.add(
                        'active'
                    );
                }
            });


        this.renderPreview();


        if (
            window.app &&
            app.showToast
        ) {

            app.showToast(
                `Switched to Template ${templateName.toUpperCase()}`,
                'info'
            );
        }
    }


    // ==========================================
    // COLOR
    // ==========================================

    setColor(colorHex) {

        this.accentColor =
            colorHex;


        document
            .querySelectorAll(
                '.color-dot'
            )
            .forEach(dot => {

                dot.classList.remove(
                    'active'
                );


                if (
                    dot.style.background ===
                        colorHex ||
                    dot.style.backgroundColor ===
                        colorHex
                ) {

                    dot.classList.add(
                        'active'
                    );
                }
            });


        this.renderPreview();
    }


    // ==========================================
    // FONT
    // ==========================================

    setFont(fontValue) {

        this.fontFamily =
            fontValue;

        this.renderPreview();
    }


    // ==========================================
    // GET AVATAR
    // ==========================================

    getAvatarUrl(data) {

        if (
            data &&
            data.avatarUrl
        ) {

            return data.avatarUrl;
        }


        if (
            data &&
            data.gender === 'male'
        ) {

            return '/static/images/avatar-male.svg';
        }


        if (
            data &&
            data.gender === 'admin'
        ) {

            return '/static/images/avatar-admin.svg';
        }


        return '/static/images/avatar-female.svg';
    }


    // ==========================================
    // ESCAPE HTML
    // ==========================================

    escapeHtml(value) {

        if (
            value === null ||
            value === undefined
        ) {

            return '';
        }


        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }


    // ==========================================
    // EDUCATION FORMAT
    // ==========================================

    formatEducation(ed) {

        if (!ed) return '';


        const level =
            ed.level ||
            ed.degree ||
            '';


        const degree =
            ed.degree &&
            ed.degree !== ed.level
                ? ed.degree
                : '';


        const institution =
            ed.institution || '';


        const course =
            ed.course || '';


        const specialization =
            ed.specialization || '';


        const score =
            ed.score ||
            ed.cgpa ||
            '';


        const duration =
            ed.duration || '';


        let html = '';


        // Main education title

        html += `
            <div style="
                font-weight:700;
                font-size:10pt;
                color:#0f172a;
            ">
                ${this.escapeHtml(
                    degree || level
                )}
            </div>
        `;


        // Institution

        if (institution) {

            html += `
                <div style="
                    font-size:9.5pt;
                    color:#334155;
                    margin-top:2px;
                ">
                    ${this.escapeHtml(
                        institution
                    )}
                </div>
            `;
        }


        // Course

        if (course) {

            html += `
                <div style="
                    font-size:9pt;
                    color:#475569;
                    margin-top:2px;
                ">
                    ${this.escapeHtml(
                        course
                    )}
                </div>
            `;
        }


        // Specialization

        if (specialization) {

            html += `
                <div style="
                    font-size:9pt;
                    color:#475569;
                ">
                    Specialization:
                    ${this.escapeHtml(
                        specialization
                    )}
                </div>
            `;
        }


        // Score

        if (score) {

            html += `
                <div style="
                    font-size:9pt;
                    color:#475569;
                ">
                    ${this.escapeHtml(
                        score
                    )}
                </div>
            `;
        }


        // Duration

        if (duration) {

            html += `
                <div style="
                    font-size:9pt;
                    color:#64748b;
                ">
                    ${this.escapeHtml(
                        duration
                    )}
                </div>
            `;
        }


        return html;
    }


    // ==========================================
    // RENDER PREVIEW
    // ==========================================

    renderPreview() {

        const paper =
            document.getElementById(
                'resumePaper'
            );


        if (!paper) return;


        this.initResumeData();


        const data =
            this.resumeData ||
            (
                window.profileManager
                    ? profileManager.profileData
                    : {}
            ) ||
            {};


        paper.style.fontFamily =
            this.fontFamily;


        paper.style.setProperty(
            '--resume-accent',
            this.accentColor
        );


        const showSummary =
            document.getElementById(
                'toggleSummary'
            )?.checked ?? true;


        const showEdu =
            document.getElementById(
                'toggleEducation'
            )?.checked ?? true;


        const showSkills =
            document.getElementById(
                'toggleSkills'
            )?.checked ?? true;


        const showProjects =
            document.getElementById(
                'toggleProjects'
            )?.checked ?? true;


        const showExp =
            document.getElementById(
                'toggleExperience'
            )?.checked ?? true;


        const showCerts =
            document.getElementById(
                'toggleCerts'
            )?.checked ?? true;


        const fullName =
            data.fullName || '';


        const headline =
            data.headline || '';


        const email =
            data.email || '';


        const phone =
            data.phone || '';


        const location =
            data.location || '';


        const objective =
            data.objective || '';


        const skills =
            Array.isArray(data.skills)
                ? data.skills
                : [];


        const experience =
            Array.isArray(data.experience)
                ? data.experience
                : [];


        const projects =
            Array.isArray(data.projects)
                ? data.projects
                : [];


        const education =
            Array.isArray(data.education)
                ? data.education
                : [];


        const avatarUrl =
            this.getAvatarUrl(data);


        // ======================================
        // TEMPLATE 1: MODERN
        // ======================================

        if (
            this.selectedTemplate ===
            'modern'
        ) {

            paper.className =
                'resume-paper-container resume-template-modern';


            paper.innerHTML = `

                <header style="
                    border-bottom:2.5px solid ${this.accentColor};
                    padding-bottom:14px;
                    margin-bottom:16px;
                ">

                    <h1 style="
                        color:${this.accentColor};
                        font-size:22pt;
                        font-weight:800;
                        margin-bottom:2px;
                    ">
                        ${this.escapeHtml(fullName)}
                    </h1>


                    ${
                        headline
                            ? `
                            <div style="
                                font-size:11pt;
                                color:#475569;
                                font-weight:600;
                                margin-bottom:8px;
                            ">
                                ${this.escapeHtml(headline)}
                            </div>
                            `
                            : ''
                    }


                    <div style="
                        font-size:9pt;
                        color:#334155;
                        display:flex;
                        gap:14px;
                        flex-wrap:wrap;
                    ">

                        ${
                            email
                                ? `
                                <span>
                                    <i class="fa-solid fa-envelope"></i>
                                    ${this.escapeHtml(email)}
                                </span>
                                `
                                : ''
                        }


                        ${
                            phone
                                ? `
                                <span>
                                    <i class="fa-solid fa-phone"></i>
                                    ${this.escapeHtml(phone)}
                                </span>
                                `
                                : ''
                        }


                        ${
                            location
                                ? `
                                <span>
                                    <i class="fa-solid fa-location-dot"></i>
                                    ${this.escapeHtml(location)}
                                </span>
                                `
                                : ''
                        }

                    </div>

                </header>


                ${
                    showSummary && objective
                        ? `

                        <section style="
                            margin-bottom:14px;
                        ">

                            <h2 style="
                                color:${this.accentColor};
                                font-size:11.5pt;
                                font-weight:700;
                                border-bottom:1px solid #cbd5e1;
                                padding-bottom:3px;
                                margin-bottom:6px;
                                text-transform:uppercase;
                            ">
                                Professional Summary
                            </h2>

                            <p style="
                                font-size:9.5pt;
                                color:#334155;
                                line-height:1.5;
                            ">
                                ${this.escapeHtml(objective)}
                            </p>

                        </section>

                        `
                        : ''
                }


                ${
                    showSkills && skills.length
                        ? `

                        <section style="
                            margin-bottom:14px;
                        ">

                            <h2 style="
                                color:${this.accentColor};
                                font-size:11.5pt;
                                font-weight:700;
                                border-bottom:1px solid #cbd5e1;
                                padding-bottom:3px;
                                margin-bottom:8px;
                                text-transform:uppercase;
                            ">
                                Technical Skills
                            </h2>


                            <div style="
                                display:flex;
                                flex-wrap:wrap;
                                gap:6px;
                            ">

                                ${skills.map(skill => `

                                    <span style="
                                        background:rgba(79,70,229,0.08);
                                        border:1px solid ${this.accentColor}33;
                                        color:${this.accentColor};
                                        font-size:8.5pt;
                                        padding:2px 8px;
                                        border-radius:4px;
                                        font-weight:600;
                                    ">
                                        ${this.escapeHtml(skill)}
                                    </span>

                                `).join('')}

                            </div>

                        </section>

                        `
                        : ''
                }


                ${
                    showExp && experience.length
                        ? `

                        <section style="
                            margin-bottom:14px;
                        ">

                            <h2 style="
                                color:${this.accentColor};
                                font-size:11.5pt;
                                font-weight:700;
                                border-bottom:1px solid #cbd5e1;
                                padding-bottom:3px;
                                margin-bottom:8px;
                                text-transform:uppercase;
                            ">
                                Work Experience
                            </h2>


                            ${experience.map(e => `

                                <div style="
                                    margin-bottom:10px;
                                ">

                                    <div style="
                                        display:flex;
                                        justify-content:space-between;
                                        font-weight:700;
                                        font-size:10pt;
                                        color:#0f172a;
                                    ">

                                        <span>

                                            ${this.escapeHtml(
                                                e.role || ''
                                            )}

                                            ${
                                                e.company
                                                    ? `
                                                    —
                                                    <span style="
                                                        color:${this.accentColor};
                                                    ">
                                                        ${this.escapeHtml(e.company)}
                                                    </span>
                                                    `
                                                    : ''
                                            }

                                        </span>


                                        ${
                                            e.duration
                                                ? `
                                                <span style="
                                                    color:#64748b;
                                                    font-size:9pt;
                                                    font-weight:400;
                                                ">
                                                    ${this.escapeHtml(e.duration)}
                                                </span>
                                                `
                                                : ''
                                        }

                                    </div>


                                    ${
                                        e.description
                                            ? `
                                            <p style="
                                                font-size:9.5pt;
                                                color:#334155;
                                                margin-top:2px;
                                            ">
                                                ${this.escapeHtml(e.description)}
                                            </p>
                                            `
                                            : ''
                                    }

                                </div>

                            `).join('')}

                        </section>

                        `
                        : ''
                }


                ${
                    showProjects && projects.length
                        ? `

                        <section style="
                            margin-bottom:14px;
                        ">

                            <h2 style="
                                color:${this.accentColor};
                                font-size:11.5pt;
                                font-weight:700;
                                border-bottom:1px solid #cbd5e1;
                                padding-bottom:3px;
                                margin-bottom:8px;
                                text-transform:uppercase;
                            ">
                                Projects
                            </h2>


                            ${projects.map(p => `

                                <div style="
                                    margin-bottom:8px;
                                ">

                                    <div style="
                                        font-weight:700;
                                        font-size:10pt;
                                        color:#0f172a;
                                    ">

                                        ${this.escapeHtml(
                                            p.title || ''
                                        )}

                                        ${
                                            p.tech
                                                ? `
                                                <span style="
                                                    font-weight:400;
                                                    font-size:8.5pt;
                                                    color:#64748b;
                                                ">
                                                    (${this.escapeHtml(p.tech)})
                                                </span>
                                                `
                                                : ''
                                        }

                                    </div>


                                    ${
                                        p.description
                                            ? `
                                            <p style="
                                                font-size:9.5pt;
                                                color:#334155;
                                            ">
                                                ${this.escapeHtml(p.description)}
                                            </p>
                                            `
                                            : ''
                                    }

                                </div>

                            `).join('')}

                        </section>

                        `
                        : ''
                }


                ${
                    showEdu && education.length
                        ? `

                        <section style="
                            margin-bottom:14px;
                        ">

                            <h2 style="
                                color:${this.accentColor};
                                font-size:11.5pt;
                                font-weight:700;
                                border-bottom:1px solid #cbd5e1;
                                padding-bottom:3px;
                                margin-bottom:8px;
                                text-transform:uppercase;
                            ">
                                Education
                            </h2>


                            ${education.map(ed => `

                                <div style="
                                    margin-bottom:9px;
                                    padding-bottom:6px;
                                    border-bottom:1px solid #e2e8f0;
                                ">

                                    ${this.formatEducation(ed)}

                                </div>

                            `).join('')}

                        </section>

                        `
                        : ''
                }

            `;
        }


        // ======================================
        // TEMPLATE 2: EXECUTIVE
        // ======================================

        else if (
            this.selectedTemplate ===
            'executive'
        ) {

            paper.className =
                'resume-paper-container resume-template-executive';


            paper.innerHTML = `

                <div style="
                    text-align:center;
                    border-bottom:1.5px solid #0f172a;
                    padding-bottom:12px;
                    margin-bottom:18px;
                ">

                    <h1 style="
                        font-size:20pt;
                        text-transform:uppercase;
                        letter-spacing:2px;
                        font-weight:700;
                        color:#0f172a;
                        margin-bottom:4px;
                    ">
                        ${this.escapeHtml(fullName)}
                    </h1>


                    ${
                        headline
                            ? `
                            <div style="
                                font-size:10pt;
                                color:#475569;
                                letter-spacing:0.5px;
                                margin-bottom:6px;
                            ">
                                ${this.escapeHtml(headline)}
                            </div>
                            `
                            : ''
                    }


                    <div style="
                        font-size:9pt;
                        color:#475569;
                    ">

                        ${
                            email
                                ? this.escapeHtml(email)
                                : ''
                        }

                        ${
                            phone
                                ? ` &nbsp;|&nbsp; ${this.escapeHtml(phone)}`
                                : ''
                        }

                        ${
                            location
                                ? ` &nbsp;|&nbsp; ${this.escapeHtml(location)}`
                                : ''
                        }

                    </div>

                </div>


                ${
                    showSummary && objective
                        ? `

                        <section style="
                            margin-bottom:16px;
                        ">

                            <h3 style="
                                border-bottom:1px solid #0f172a;
                                font-size:10.5pt;
                                font-weight:700;
                                letter-spacing:1px;
                                text-transform:uppercase;
                                margin-bottom:6px;
                                color:#0f172a;
                            ">
                                Profile Summary
                            </h3>


                            <p style="
                                font-size:9.5pt;
                                color:#334155;
                                line-height:1.5;
                            ">
                                ${this.escapeHtml(objective)}
                            </p>

                        </section>

                        `
                        : ''
                }


                ${
                    showSkills && skills.length
                        ? `

                        <section style="
                            margin-bottom:16px;
                        ">

                            <h3 style="
                                border-bottom:1px solid #0f172a;
                                font-size:10.5pt;
                                font-weight:700;
                                letter-spacing:1px;
                                text-transform:uppercase;
                                margin-bottom:6px;
                                color:#0f172a;
                            ">
                                Core Competencies
                            </h3>


                            <p style="
                                font-size:9.5pt;
                                color:#1e293b;
                            ">
                                ${skills
                                    .map(s =>
                                        this.escapeHtml(s)
                                    )
                                    .join(' • ')}
                            </p>

                        </section>

                        `
                        : ''
                }


                ${
                    showExp && experience.length
                        ? `

                        <section style="
                            margin-bottom:16px;
                        ">

                            <h3 style="
                                border-bottom:1px solid #0f172a;
                                font-size:10.5pt;
                                font-weight:700;
                                letter-spacing:1px;
                                text-transform:uppercase;
                                margin-bottom:8px;
                                color:#0f172a;
                            ">
                                Professional Experience
                            </h3>


                            ${experience.map(e => `

                                <div style="
                                    margin-bottom:10px;
                                ">

                                    <div style="
                                        display:flex;
                                        justify-content:space-between;
                                        font-size:10pt;
                                    ">

                                        <strong style="
                                            color:#0f172a;
                                        ">
                                            ${this.escapeHtml(
                                                e.company || ''
                                            )}
                                        </strong>


                                        ${
                                            e.duration
                                                ? `
                                                <span style="
                                                    font-size:9pt;
                                                    font-style:italic;
                                                    color:#475569;
                                                ">
                                                    ${this.escapeHtml(e.duration)}
                                                </span>
                                                `
                                                : ''
                                        }

                                    </div>


                                    ${
                                        e.role
                                            ? `
                                            <div style="
                                                font-size:9.5pt;
                                                font-style:italic;
                                                color:#475569;
                                                margin-bottom:2px;
                                            ">
                                                ${this.escapeHtml(e.role)}
                                            </div>
                                            `
                                            : ''
                                    }


                                    ${
                                        e.description
                                            ? `
                                            <p style="
                                                font-size:9.5pt;
                                                color:#334155;
                                            ">
                                                ${this.escapeHtml(e.description)}
                                            </p>
                                            `
                                            : ''
                                    }

                                </div>

                            `).join('')}

                        </section>

                        `
                        : ''
                }


                ${
                    showProjects && projects.length
                        ? `

                        <section style="
                            margin-bottom:16px;
                        ">

                            <h3 style="
                                border-bottom:1px solid #0f172a;
                                font-size:10.5pt;
                                font-weight:700;
                                letter-spacing:1px;
                                text-transform:uppercase;
                                margin-bottom:8px;
                                color:#0f172a;
                            ">
                                Key Projects
                            </h3>


                            ${projects.map(p => `

                                <div style="
                                    margin-bottom:8px;
                                ">

                                    <div style="
                                        font-size:10pt;
                                        font-weight:700;
                                        color:#0f172a;
                                    ">

                                        ${this.escapeHtml(
                                            p.title || ''
                                        )}

                                        ${
                                            p.tech
                                                ? `
                                                <span style="
                                                    font-weight:400;
                                                    font-size:8.5pt;
                                                    color:#64748b;
                                                ">
                                                    (${this.escapeHtml(p.tech)})
                                                </span>
                                                `
                                                : ''
                                        }

                                    </div>


                                    ${
                                        p.description
                                            ? `
                                            <p style="
                                                font-size:9.5pt;
                                                color:#334155;
                                            ">
                                                ${this.escapeHtml(p.description)}
                                            </p>
                                            `
                                            : ''
                                    }

                                </div>

                            `).join('')}

                        </section>

                        `
                        : ''
                }


                ${
                    showEdu && education.length
                        ? `

                        <section style="
                            margin-bottom:16px;
                        ">

                            <h3 style="
                                border-bottom:1px solid #0f172a;
                                font-size:10.5pt;
                                font-weight:700;
                                letter-spacing:1px;
                                text-transform:uppercase;
                                margin-bottom:8px;
                                color:#0f172a;
                            ">
                                Education & Academics
                            </h3>


                            ${education.map(ed => `

                                <div style="
                                    margin-bottom:10px;
                                ">

                                    ${this.formatEducation(ed)}

                                </div>

                            `).join('')}

                        </section>

                        `
                        : ''
                }

            `;
        }


        // ======================================
        // TEMPLATE 3: CREATIVE
        // ======================================

        else if (
            this.selectedTemplate ===
            'creative'
        ) {

            paper.className =
                'resume-paper-container resume-template-creative';


            paper.innerHTML = `

                <div style="
                    background:linear-gradient(
                        135deg,
                        #0f172a 0%,
                        ${this.accentColor} 100%
                    );
                    color:#ffffff;
                    padding:22px 24px;
                    border-radius:6px;
                    margin-bottom:18px;
                ">

                    <h1 style="
                        font-size:22pt;
                        font-weight:800;
                        color:#ffffff;
                        margin-bottom:2px;
                    ">
                        ${this.escapeHtml(fullName)}
                    </h1>


                    ${
                        headline
                            ? `
                            <div style="
                                font-size:11pt;
                                color:rgba(255,255,255,0.85);
                                font-weight:500;
                                margin-bottom:12px;
                            ">
                                ${this.escapeHtml(headline)}
                            </div>
                            `
                            : ''
                    }


                    <div style="
                        font-size:9pt;
                        color:rgba(255,255,255,0.9);
                        display:flex;
                        gap:14px;
                        flex-wrap:wrap;
                    ">

                        ${
                            email
                                ? `
                                <span>
                                    <i class="fa-solid fa-envelope"></i>
                                    ${this.escapeHtml(email)}
                                </span>
                                `
                                : ''
                        }


                        ${
                            phone
                                ? `
                                <span>
                                    <i class="fa-solid fa-phone"></i>
                                    ${this.escapeHtml(phone)}
                                </span>
                                `
                                : ''
                        }


                        ${
                            location
                                ? `
                                <span>
                                    <i class="fa-solid fa-location-dot"></i>
                                    ${this.escapeHtml(location)}
                                </span>
                                `
                                : ''
                        }

                    </div>

                </div>


                ${
                    showSummary && objective
                        ? `

                        <section style="
                            margin-bottom:16px;
                        ">

                            <h2 style="
                                color:${this.accentColor};
                                font-size:12pt;
                                font-weight:700;
                                margin-bottom:6px;
                            ">
                                About Me
                            </h2>


                            <p style="
                                font-size:9.5pt;
                                color:#334155;
                                line-height:1.5;
                            ">
                                ${this.escapeHtml(objective)}
                            </p>

                        </section>

                        `
                        : ''
                }


                ${
                    showExp && experience.length
                        ? `

                        <section style="
                            margin-bottom:16px;
                        ">

                            <h2 style="
                                color:${this.accentColor};
                                font-size:12pt;
                                font-weight:700;
                                margin-bottom:8px;
                            ">
                                Experience Timeline
                            </h2>


                            ${experience.map(e => `

                                <div style="
                                    border-left:3px solid ${this.accentColor};
                                    padding-left:12px;
                                    margin-bottom:10px;
                                ">

                                    <div style="
                                        display:flex;
                                        justify-content:space-between;
                                        font-weight:700;
                                        font-size:10pt;
                                        color:#0f172a;
                                    ">

                                        <span>

                                            ${this.escapeHtml(
                                                e.role || ''
                                            )}

                                            ${
                                                e.company
                                                    ? `
                                                    @
                                                    <span style="
                                                        color:${this.accentColor};
                                                    ">
                                                        ${this.escapeHtml(e.company)}
                                                    </span>
                                                    `
                                                    : ''
                                            }

                                        </span>


                                        ${
                                            e.duration
                                                ? `
                                                <span style="
                                                    color:#64748b;
                                                    font-size:8.5pt;
                                                ">
                                                    ${this.escapeHtml(e.duration)}
                                                </span>
                                                `
                                                : ''
                                        }

                                    </div>


                                    ${
                                        e.description
                                            ? `
                                            <p style="
                                                font-size:9.5pt;
                                                color:#334155;
                                                margin-top:2px;
                                            ">
                                                ${this.escapeHtml(e.description)}
                                            </p>
                                            `
                                            : ''
                                    }

                                </div>

                            `).join('')}

                        </section>

                        `
                        : ''
                }


                ${
                    showProjects && projects.length
                        ? `

                        <section style="
                            margin-bottom:16px;
                        ">

                            <h2 style="
                                color:${this.accentColor};
                                font-size:12pt;
                                font-weight:700;
                                margin-bottom:8px;
                            ">
                                Highlighted Projects
                            </h2>


                            ${projects.map(p => `

                                <div style="
                                    border-left:3px solid #0f172a;
                                    padding-left:12px;
                                    margin-bottom:8px;
                                ">

                                    <div style="
                                        font-weight:700;
                                        font-size:10pt;
                                        color:#0f172a;
                                    ">

                                        ${this.escapeHtml(
                                            p.title || ''
                                        )}

                                        ${
                                            p.tech
                                                ? `
                                                <span style="
                                                    font-weight:400;
                                                    font-size:8.5pt;
                                                    color:#64748b;
                                                ">
                                                    (${this.escapeHtml(p.tech)})
                                                </span>
                                                `
                                                : ''
                                        }

                                    </div>


                                    ${
                                        p.description
                                            ? `
                                            <p style="
                                                font-size:9.5pt;
                                                color:#334155;
                                            ">
                                                ${this.escapeHtml(p.description)}
                                            </p>
                                            `
                                            : ''
                                    }

                                </div>

                            `).join('')}

                        </section>

                        `
                        : ''
                }


                ${
                    showSkills && skills.length
                        ? `

                        <section style="
                            margin-bottom:16px;
                        ">

                            <h2 style="
                                color:${this.accentColor};
                                font-size:12pt;
                                font-weight:700;
                                margin-bottom:8px;
                            ">
                                Skills & Technologies
                            </h2>


                            <div style="
                                display:flex;
                                flex-wrap:wrap;
                                gap:6px;
                            ">

                                ${skills.map(skill => `

                                    <span style="
                                        background:#f1f5f9;
                                        color:#0f172a;
                                        font-size:8.5pt;
                                        padding:3px 10px;
                                        border-radius:12px;
                                        font-weight:600;
                                        border:1px solid #cbd5e1;
                                    ">
                                        ${this.escapeHtml(skill)}
                                    </span>

                                `).join('')}

                            </div>

                        </section>

                        `
                        : ''
                }


                ${
                    showEdu && education.length
                        ? `

                        <section style="
                            margin-bottom:16px;
                        ">

                            <h2 style="
                                color:${this.accentColor};
                                font-size:12pt;
                                font-weight:700;
                                margin-bottom:8px;
                            ">
                                Education
                            </h2>


                            ${education.map(ed => `

                                <div style="
                                    margin-bottom:10px;
                                ">

                                    ${this.formatEducation(ed)}

                                </div>

                            `).join('')}

                        </section>

                        `
                        : ''
                }

            `;
        }


        // ======================================
        // TEMPLATE 4: COMPACT
        // ======================================

        else if (
            this.selectedTemplate ===
            'compact'
        ) {

            paper.className =
                'resume-paper-container resume-template-compact';


            paper.innerHTML = `

                <div style="
                    display:flex;
                    gap:20px;
                ">


                    <!-- LEFT COLUMN -->

                    <div style="
                        width:32%;
                        background:#f8fafc;
                        padding:16px;
                        border-radius:6px;
                        border-right:1px solid #e2e8f0;
                    ">


                        <div style="
                            margin-bottom:16px;
                        ">

                            <img
                                src="${this.escapeHtml(avatarUrl)}"
                                style="
                                    width:64px;
                                    height:64px;
                                    border-radius:50%;
                                    border:2px solid ${this.accentColor};
                                    display:block;
                                    margin-bottom:8px;
                                    object-fit:cover;
                                "
                                alt="Profile Photo"
                            >


                            <h2 style="
                                font-size:13pt;
                                font-weight:800;
                                color:#0f172a;
                                line-height:1.2;
                            ">
                                ${this.escapeHtml(fullName)}
                            </h2>


                            ${
                                headline
                                    ? `
                                    <div style="
                                        font-size:8.5pt;
                                        color:${this.accentColor};
                                        font-weight:600;
                                    ">
                                        ${this.escapeHtml(headline)}
                                    </div>
                                    `
                                    : ''
                            }

                        </div>


                        <!-- CONTACT -->

                        <div style="
                            margin-bottom:16px;
                            font-size:8.5pt;
                            color:#475569;
                            display:flex;
                            flex-direction:column;
                            gap:6px;
                        ">

                            <strong style="
                                color:#0f172a;
                                font-size:9pt;
                                border-bottom:1px solid #cbd5e1;
                                padding-bottom:2px;
                            ">
                                CONTACT
                            </strong>


                            ${
                                email
                                    ? `
                                    <span>
                                        <i class="fa-solid fa-envelope"></i>
                                        ${this.escapeHtml(email)}
                                    </span>
                                    `
                                    : ''
                            }


                            ${
                                phone
                                    ? `
                                    <span>
                                        <i class="fa-solid fa-phone"></i>
                                        ${this.escapeHtml(phone)}
                                    </span>
                                    `
                                    : ''
                            }


                            ${
                                location
                                    ? `
                                    <span>
                                        <i class="fa-solid fa-location-dot"></i>
                                        ${this.escapeHtml(location)}
                                    </span>
                                    `
                                    : ''
                            }

                        </div>


                        <!-- SKILLS -->

                        ${
                            showSkills &&
                            skills.length
                                ? `

                                <div style="
                                    margin-bottom:16px;
                                ">

                                    <strong style="
                                        color:#0f172a;
                                        font-size:9pt;
                                        border-bottom:1px solid #cbd5e1;
                                        padding-bottom:2px;
                                        display:block;
                                        margin-bottom:6px;
                                    ">
                                        SKILLS
                                    </strong>


                                    <div style="
                                        display:flex;
                                        flex-direction:column;
                                        gap:4px;
                                        font-size:8.5pt;
                                        color:#334155;
                                    ">

                                        ${skills.map(skill => `

                                            <span>
                                                • ${this.escapeHtml(skill)}
                                            </span>

                                        `).join('')}

                                    </div>

                                </div>

                                `
                                : ''
                        }


                        <!-- EDUCATION -->

                        ${
                            showEdu &&
                            education.length
                                ? `

                                <div style="
                                    margin-bottom:16px;
                                ">

                                    <strong style="
                                        color:#0f172a;
                                        font-size:9pt;
                                        border-bottom:1px solid #cbd5e1;
                                        padding-bottom:2px;
                                        display:block;
                                        margin-bottom:6px;
                                    ">
                                        EDUCATION
                                    </strong>


                                    ${education.map(ed => `

                                        <div style="
                                            font-size:8.5pt;
                                            margin-bottom:9px;
                                        ">

                                            ${this.formatEducation(ed)}

                                        </div>

                                    `).join('')}

                                </div>

                                `
                                : ''
                        }

                    </div>


                    <!-- RIGHT COLUMN -->

                    <div style="
                        width:68%;
                    ">


                        ${
                            showSummary &&
                            objective
                                ? `

                                <section style="
                                    margin-bottom:14px;
                                ">

                                    <h3 style="
                                        color:${this.accentColor};
                                        font-size:11pt;
                                        font-weight:700;
                                        border-bottom:1px solid #cbd5e1;
                                        padding-bottom:3px;
                                        margin-bottom:6px;
                                        text-transform:uppercase;
                                    ">
                                        Executive Profile
                                    </h3>


                                    <p style="
                                        font-size:9pt;
                                        color:#334155;
                                        line-height:1.4;
                                    ">
                                        ${this.escapeHtml(objective)}
                                    </p>

                                </section>

                                `
                                : ''
                        }


                        ${
                            showExp &&
                            experience.length
                                ? `

                                <section style="
                                    margin-bottom:14px;
                                ">

                                    <h3 style="
                                        color:${this.accentColor};
                                        font-size:11pt;
                                        font-weight:700;
                                        border-bottom:1px solid #cbd5e1;
                                        padding-bottom:3px;
                                        margin-bottom:8px;
                                        text-transform:uppercase;
                                    ">
                                        Work Experience
                                    </h3>


                                    ${experience.map(e => `

                                        <div style="
                                            margin-bottom:10px;
                                        ">

                                            <div style="
                                                display:flex;
                                                justify-content:space-between;
                                                font-weight:700;
                                                font-size:9.5pt;
                                                color:#0f172a;
                                            ">

                                                <span>

                                                    ${this.escapeHtml(
                                                        e.role || ''
                                                    )}

                                                    ${
                                                        e.company
                                                            ? `
                                                            —
                                                            ${this.escapeHtml(e.company)}
                                                            `
                                                            : ''
                                                    }

                                                </span>


                                                ${
                                                    e.duration
                                                        ? `
                                                        <span style="
                                                            color:#64748b;
                                                            font-size:8.5pt;
                                                            font-weight:400;
                                                        ">
                                                            ${this.escapeHtml(e.duration)}
                                                        </span>
                                                        `
                                                        : ''
                                                }

                                            </div>


                                            ${
                                                e.description
                                                    ? `
                                                    <p style="
                                                        font-size:9pt;
                                                        color:#334155;
                                                        margin-top:2px;
                                                    ">
                                                        ${this.escapeHtml(e.description)}
                                                    </p>
                                                    `
                                                    : ''
                                            }

                                        </div>

                                    `).join('')}

                                </section>

                                `
                                : ''
                        }


                        ${
                            showProjects &&
                            projects.length
                                ? `

                                <section style="
                                    margin-bottom:14px;
                                ">

                                    <h3 style="
                                        color:${this.accentColor};
                                        font-size:11pt;
                                        font-weight:700;
                                        border-bottom:1px solid #cbd5e1;
                                        padding-bottom:3px;
                                        margin-bottom:8px;
                                        text-transform:uppercase;
                                    ">
                                        Projects
                                    </h3>


                                    ${projects.map(p => `

                                        <div style="
                                            margin-bottom:8px;
                                        ">

                                            <div style="
                                                font-weight:700;
                                                font-size:9.5pt;
                                                color:#0f172a;
                                            ">

                                                ${this.escapeHtml(
                                                    p.title || ''
                                                )}

                                                ${
                                                    p.tech
                                                        ? `
                                                        <span style="
                                                            font-weight:400;
                                                            font-size:8pt;
                                                            color:#64748b;
                                                        ">
                                                            (${this.escapeHtml(p.tech)})
                                                        </span>
                                                        `
                                                        : ''
                                                }

                                            </div>


                                            ${
                                                p.description
                                                    ? `
                                                    <p style="
                                                        font-size:9pt;
                                                        color:#334155;
                                                    ">
                                                        ${this.escapeHtml(p.description)}
                                                    </p>
                                                    `
                                                    : ''
                                            }

                                        </div>

                                    `).join('')}

                                </section>

                                `
                                : ''
                        }

                    </div>

                </div>

            `;
        }
    }


    // ==========================================
    // AI ENHANCE OBJECTIVE
    // ==========================================

    async enhanceWithAI() {

        this.initResumeData();


        if (!this.resumeData) {

            if (
                window.app &&
                app.showToast
            ) {

                app.showToast(
                    'Please complete your profile first.',
                    'error'
                );
            }

            return;
        }


        const currentObjective =
            this.resumeData.objective ||
            (
                window.profileManager &&
                profileManager.profileData
                    ? profileManager.profileData.objective
                    : ''
            ) ||
            '';


        const targetRoleInput =
            document.getElementById(
                'aiGenTargetRole'
            );


        const targetRole =
            targetRoleInput
                ? targetRoleInput.value.trim()
                : '';


        if (!currentObjective) {

            if (
                window.app &&
                app.showToast
            ) {

                app.showToast(
                    'Please write your profile objective first.',
                    'error'
                );
            }

            return;
        }


        if (!targetRole) {

            if (
                window.app &&
                app.showToast
            ) {

                app.showToast(
                    'Please enter a target job role first.',
                    'error'
                );
            }

            return;
        }


        if (
            window.app &&
            app.showToast
        ) {

            app.showToast(
                'AI is improving your real objective...',
                'info'
            );
        }


        let enhancedText =
            currentObjective;


        try {

            const res =
                await fetch(
                    '/api/resume/enhance',
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body: JSON.stringify({

                            bulletPoint:
                                currentObjective,

                            role:
                                targetRole
                        })
                    }
                );


            const data =
                await res.json();


            if (
                data.success &&
                data.enhancedBullet
            ) {

                enhancedText =
                    data.enhancedBullet;
            }

        } catch (error) {

            console.error(
                'AI enhancement error:',
                error
            );

            /*
             * Important:
             * If AI fails, keep the user's
             * original objective.
             */
        }


        this.resumeData.objective =
            enhancedText;


        this.populateEditFields();

        this.renderPreview();


        if (
            window.app &&
            app.triggerConfetti
        ) {

            app.triggerConfetti();
        }


        if (
            window.app &&
            app.showToast
        ) {

            app.showToast(
                'AI Enhancement applied to Resume Draft!',
                'success'
            );
        }
    }


    // ==========================================
    // PRINT
    // ==========================================

    printResume() {

        window.print();
    }


    // ==========================================
    // EXPORT PDF
    // ==========================================

    exportPDF() {

        const element =
            document.getElementById(
                'resumePaper'
            );


        if (!element) return;


        if (
            window.app &&
            app.showToast
        ) {

            app.showToast(
                'Generating high-resolution PDF download...',
                'info'
            );
        }


        const fullName =
            (
                this.resumeData?.fullName ||
                'Candidate'
            )
            .replace(/\s+/g, '_');


        const opt = {

            margin: 0,

            filename:
                `${fullName}_Resume.pdf`,

            image: {
                type: 'jpeg',
                quality: 0.98
            },

            html2canvas: {
                scale: 2,
                useCORS: true
            },

            jsPDF: {
                unit: 'mm',
                format: 'a4',
                orientation: 'portrait'
            }
        };


        if (
            typeof html2pdf ===
            'function'
        ) {

            html2pdf()
                .set(opt)
                .from(element)
                .save()
                .then(() => {

                    if (
                        window.app &&
                        app.showToast
                    ) {

                        app.showToast(
                            'PDF Resume downloaded successfully!',
                            'success'
                        );
                    }
                });

        } else {

            window.print();
        }
    }
}


// ==========================================
// GLOBAL SINGLETON
// ==========================================

const resumeBuilder =
    new ResumeBuilder();
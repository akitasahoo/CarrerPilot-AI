/**
 * CareerPilot AI - Profile Manager
 * Real user profile + image upload + education management
 */

class ProfileManager {

    constructor() {
        this.profileData = this.getDefaultData();
    }


    // ==========================================
    // DEFAULT EMPTY PROFILE
    // ==========================================

    getDefaultData(user = null) {

        const isAdmin = user && user.role === "admin";

        const name = user ? (user.name || "") : "";
        const email = user ? (user.email || "") : "";
        const gender = user ? (user.gender || "") : "";

        let avatarPath = "/static/images/avatar-female.svg";

        if (isAdmin) {
            avatarPath = "/static/images/avatar-admin.svg";
        }
        else if (gender === "male") {
            avatarPath = "/static/images/avatar-male.svg";
        }

        return {

            fullName: name,
            email: email,
            gender: gender,

            avatarUrl: avatarPath,

            phone: "",
            location: "",

            linkedin: "",
            github: "",
            website: "",

            headline: "",
            objective: "",

            skills: [],

            education: [],

            projects: [],

            experience: [],

            certifications: "",
            achievements: "",
            languages: "",
            interests: ""
        };
    }


    // ==========================================
    // RENDER
    // ==========================================

    render() {

        this.bindFields();

        this.renderSkills();

        this.renderEducationList();

        this.renderProjectsList();

        this.renderExperienceList();

        this.calculateCompleteness();

        this.updateProfileImagePreview();
    }


    // ==========================================
    // BIND PERSONAL FIELDS
    // ==========================================

    bindFields() {

        const fields = {

            profFullName: this.profileData.fullName,
            profEmail: this.profileData.email,
            profPhone: this.profileData.phone,
            profLocation: this.profileData.location,

            profLinkedin: this.profileData.linkedin,
            profGithub: this.profileData.github,
            profWebsite: this.profileData.website,

            profObjective: this.profileData.objective,

            profCertifications: this.profileData.certifications,
            profAchievements: this.profileData.achievements,

            profLanguages: this.profileData.languages,
            profInterests: this.profileData.interests
        };


        Object.entries(fields).forEach(([id, value]) => {

            const element = document.getElementById(id);

            if (element) {
                element.value = value || "";
            }

        });


        const userGender =
            (app.user && app.user.gender) ||
            this.profileData.gender ||
            "female";

        this.highlightAvatarOption(userGender);
    }


    // ==========================================
    // PROFILE IMAGE
    // ==========================================

    updateProfileImagePreview() {

        const image = document.getElementById("profilePhotoPreview");

        if (!image) return;

        image.src =
            this.profileData.avatarUrl ||
            "/static/images/avatar-female.svg";
    }


    async handleProfileImage(input) {

        const file = input.files && input.files[0];

        if (!file) return;


        // Allowed formats
        const allowedTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
        ];


        if (!allowedTypes.includes(file.type)) {

            app.showToast(
                "Please upload JPG, PNG or WEBP image.",
                "error"
            );

            input.value = "";

            return;
        }


        // 5 MB maximum
        if (file.size > 5 * 1024 * 1024) {

            app.showToast(
                "Profile image must be smaller than 5 MB.",
                "error"
            );

            input.value = "";

            return;
        }


        // Instant browser preview
        const reader = new FileReader();

        reader.onload = (event) => {

            const preview =
                document.getElementById("profilePhotoPreview");

            if (preview) {
                preview.src = event.target.result;
            }
        };

        reader.readAsDataURL(file);


        // Upload to Flask
        const formData = new FormData();

        formData.append("profileImage", file);


        try {

            app.showToast(
                "Uploading profile photo...",
                "info"
            );


            const response = await fetch(
                "/api/profile/avatar",
                {
                    method: "POST",
                    body: formData
                }
            );


            const data = await response.json();


            if (!response.ok || !data.success) {

                throw new Error(
                    data.message ||
                    "Image upload failed."
                );
            }


            this.profileData.avatarUrl =
                data.avatarUrl;


            localStorage.setItem(
                "careerpilot_profile",
                JSON.stringify(this.profileData)
            );


            this.updateProfileImagePreview();


            if (app.renderUserNav) {
                app.renderUserNav();
            }


            app.showToast(
                "Profile photo uploaded successfully!",
                "success"
            );

        }
        catch (error) {

            console.error(
                "Profile image upload error:",
                error
            );

            app.showToast(
                "Could not upload profile photo.",
                "error"
            );
        }
    }


    removeProfileImage() {

        const user =
            app.user || {};

        let defaultAvatar =
            "/static/images/avatar-female.svg";


        if (user.role === "admin") {

            defaultAvatar =
                "/static/images/avatar-admin.svg";

        }
        else if (user.gender === "male") {

            defaultAvatar =
                "/static/images/avatar-male.svg";
        }


        this.profileData.avatarUrl =
            defaultAvatar;


        this.updateProfileImagePreview();


        const input =
            document.getElementById("profilePhotoInput");

        if (input) {
            input.value = "";
        }


        app.showToast(
            "Profile photo reset to default avatar.",
            "info"
        );
    }


    // ==========================================
    // GENDER AVATAR
    // ==========================================

    selectGender(gender) {

        if (
            app.user &&
            app.user.role === "admin"
        ) {
            return;
        }


        if (app.user) {
            app.user.gender = gender;
        }


        this.profileData.gender = gender;


        /*
         * Only change avatar if the user
         * is currently using a default avatar.
         */
        const currentAvatar =
            this.profileData.avatarUrl || "";


        const isCustomImage =
            currentAvatar.includes(
                "/static/uploads/profile_images/"
            );


        if (!isCustomImage) {

            this.profileData.avatarUrl =
                gender === "male"
                    ? "/static/images/avatar-male.svg"
                    : "/static/images/avatar-female.svg";

            this.updateProfileImagePreview();
        }


        this.highlightAvatarOption(gender);


        if (app.renderUserNav) {
            app.renderUserNav();
        }


        app.showToast(
            `Avatar preset updated to ${
                gender === "female"
                    ? "Female 👩"
                    : "Male 👨"
            } Candidate`,
            "success"
        );
    }


    highlightAvatarOption(gender) {

        const female =
            document.getElementById("avatarOptFemale");

        const male =
            document.getElementById("avatarOptMale");

        const admin =
            document.getElementById("avatarOptAdmin");


        [female, male, admin].forEach(
            element => {

                if (element) {
                    element.classList.remove(
                        "selected"
                    );
                }

            }
        );


        if (
            app.user &&
            app.user.role === "admin"
        ) {

            if (admin) {
                admin.classList.add("selected");
            }

        }
        else if (gender === "male") {

            if (male) {
                male.classList.add("selected");
            }

        }
        else {

            if (female) {
                female.classList.add("selected");
            }
        }
    }


    // ==========================================
    // PROFILE TABS
    // ==========================================

    switchTab(tabId) {

        document
            .querySelectorAll(".profile-tab-btn")
            .forEach(btn =>
                btn.classList.remove("active")
            );


        document
            .querySelectorAll(".profile-tab-content")
            .forEach(content =>
                content.classList.remove("active")
            );


        const targetButton =
            [...document.querySelectorAll(
                ".profile-tab-btn"
            )].find(
                btn =>
                    btn.getAttribute("onclick") &&
                    btn.getAttribute("onclick")
                        .includes(`'${tabId}'`)
            );


        if (targetButton) {
            targetButton.classList.add("active");
        }


        const target =
            document.getElementById(
                `tab-${tabId}`
            );


        if (target) {
            target.classList.add("active");
        }
    }


    // ==========================================
    // SKILLS
    // ==========================================

    renderSkills() {

        const container =
            document.getElementById(
                "skillsTagsContainer"
            );

        if (!container) return;


        container.innerHTML =
            this.profileData.skills
                .map(
                    (skill, index) => `
                        <span class="skill-tag">
                            ${this.escapeHtml(skill)}

                            <i
                                class="fa-solid fa-xmark"
                                onclick="profileManager.removeSkill(${index})"
                            ></i>
                        </span>
                    `
                )
                .join("");
    }


    addSkillTag() {

        const input =
            document.getElementById("skillInput");

        if (!input) return;


        const value =
            input.value.trim();

        if (!value) return;


        const skills =
            value
                .split(",")
                .map(skill => skill.trim())
                .filter(Boolean);


        skills.forEach(skill => {

            if (
                !this.profileData.skills.includes(
                    skill
                )
            ) {

                this.profileData.skills.push(
                    skill
                );
            }

        });


        input.value = "";

        this.renderSkills();

        this.calculateCompleteness();
    }


    removeSkill(index) {

        this.profileData.skills.splice(
            index,
            1
        );

        this.renderSkills();

        this.calculateCompleteness();
    }


    // ==========================================
    // EDUCATION
    // ==========================================

    renderEducationList() {

        const container =
            document.getElementById(
                "educationListContainer"
            );

        if (!container) return;


        container.innerHTML =
            this.profileData.education
                .map(
                    (edu, index) => {

                        const level =
                            edu.level || "";


                        return `
                            <div class="dynamic-item-card">

                                <button
                                    type="button"
                                    class="remove-btn"
                                    onclick="profileManager.removeEducation(${index})"
                                >
                                    <i class="fa-solid fa-trash"></i>
                                </button>


                                <div class="form-grid">

                                    <!-- Education Type -->

                                    <div class="form-group col-span-2">

                                        <label>
                                            Education Type *
                                        </label>

                                        <select
                                            class="form-control edu-level"
                                        >

                                            <option value="">
                                                Select Education Type
                                            </option>

                                            <option
                                                value="10th"
                                                ${level === "10th" ? "selected" : ""}
                                            >
                                                10th
                                            </option>

                                            <option
                                                value="12th"
                                                ${level === "12th" ? "selected" : ""}
                                            >
                                                12th
                                            </option>

                                            <option
                                                value="Diploma"
                                                ${level === "Diploma" ? "selected" : ""}
                                            >
                                                Diploma
                                            </option>

                                            <option
                                                value="Graduation"
                                                ${level === "Graduation" ? "selected" : ""}
                                            >
                                                Graduation
                                            </option>

                                        </select>

                                    </div>


                                    <!-- School / University -->

                                    <div class="form-group col-span-2">

                                        <label>
                                            School / College / University *
                                        </label>

                                        <input
                                            type="text"
                                            class="form-control edu-institution"
                                            value="${this.escapeAttribute(edu.institution || "")}"
                                            placeholder="Enter your school, college or university name"
                                        >

                                    </div>


                                    <!-- Course / Degree -->

                                    <div class="form-group">

                                        <label>
                                            Course / Degree
                                        </label>

                                        <input
                                            type="text"
                                            class="form-control edu-course"
                                            value="${this.escapeAttribute(edu.course || "")}"
                                            placeholder="e.g. B.Tech CSE / Diploma in Engineering"
                                        >

                                    </div>


                                    <!-- Specialization -->

                                    <div class="form-group">

                                        <label>
                                            Specialization / Stream
                                        </label>

                                        <input
                                            type="text"
                                            class="form-control edu-specialization"
                                            value="${this.escapeAttribute(edu.specialization || "")}"
                                            placeholder="e.g. Computer Science"
                                        >

                                    </div>


                                    <!-- Score -->

                                    <div class="form-group">

                                        <label>
                                            Percentage / CGPA / Score
                                        </label>

                                        <input
                                            type="text"
                                            class="form-control edu-cgpa"
                                            value="${this.escapeAttribute(edu.cgpa || "")}"
                                            placeholder="e.g. 8.5 CGPA / 85%"
                                        >

                                    </div>


                                    <!-- Duration -->

                                    <div class="form-group">

                                        <label>
                                            Year / Duration
                                        </label>

                                        <input
                                            type="text"
                                            class="form-control edu-duration"
                                            value="${this.escapeAttribute(edu.duration || "")}"
                                            placeholder="e.g. 2022 - 2026"
                                        >

                                    </div>

                                </div>

                            </div>
                        `;
                    }
                )
                .join("");
    }


    addEducationField() {

        this.profileData.education.push({

            level: "",

            institution: "",

            course: "",

            specialization: "",

            cgpa: "",

            duration: "",

            // Resume compatibility
            degree: ""

        });


        this.renderEducationList();
    }


    removeEducation(index) {

        this.profileData.education.splice(
            index,
            1
        );

        this.renderEducationList();

        this.calculateCompleteness();
    }


    // ==========================================
    // PROJECTS
    // ==========================================

    renderProjectsList() {

        const container =
            document.getElementById(
                "projectsListContainer"
            );

        if (!container) return;


        container.innerHTML =
            this.profileData.projects
                .map(
                    (project, index) => `
                        <div class="dynamic-item-card">

                            <button
                                type="button"
                                class="remove-btn"
                                onclick="profileManager.removeProject(${index})"
                            >
                                <i class="fa-solid fa-trash"></i>
                            </button>

                            <div class="form-grid">

                                <div class="form-group col-span-2">

                                    <label>
                                        Project Title
                                    </label>

                                    <input
                                        type="text"
                                        class="form-control proj-title"
                                        value="${this.escapeAttribute(project.title || "")}"
                                        placeholder="Project Name"
                                    >

                                </div>


                                <div class="form-group col-span-2">

                                    <label>
                                        Description & Key Features
                                    </label>

                                    <textarea
                                        class="form-control proj-desc"
                                        rows="2"
                                        placeholder="Brief overview of what you built..."
                                    >${this.escapeHtml(project.description || "")}</textarea>

                                </div>


                                <div class="form-group">

                                    <label>
                                        Technologies Used
                                    </label>

                                    <input
                                        type="text"
                                        class="form-control proj-tech"
                                        value="${this.escapeAttribute(project.tech || "")}"
                                        placeholder="Python, Flask, SQL"
                                    >

                                </div>


                                <div class="form-group">

                                    <label>
                                        GitHub Repository URL
                                    </label>

                                    <input
                                        type="url"
                                        class="form-control proj-github"
                                        value="${this.escapeAttribute(project.github || "")}"
                                        placeholder="https://github.com/user/repo"
                                    >

                                </div>

                            </div>

                        </div>
                    `
                )
                .join("");
    }


    addProjectField() {

        this.profileData.projects.push({

            title: "",
            description: "",
            tech: "",
            github: ""

        });

        this.renderProjectsList();
    }


    removeProject(index) {

        this.profileData.projects.splice(
            index,
            1
        );

        this.renderProjectsList();

        this.calculateCompleteness();
    }


    // ==========================================
    // EXPERIENCE
    // ==========================================

    renderExperienceList() {

        const container =
            document.getElementById(
                "experienceListContainer"
            );

        if (!container) return;


        container.innerHTML =
            this.profileData.experience
                .map(
                    (experience, index) => `
                        <div class="dynamic-item-card">

                            <button
                                type="button"
                                class="remove-btn"
                                onclick="profileManager.removeExperience(${index})"
                            >
                                <i class="fa-solid fa-trash"></i>
                            </button>

                            <div class="form-grid">

                                <div class="form-group">

                                    <label>
                                        Job Title / Role
                                    </label>

                                    <input
                                        type="text"
                                        class="form-control exp-role"
                                        value="${this.escapeAttribute(experience.role || "")}"
                                        placeholder="Software Engineering Intern"
                                    >

                                </div>


                                <div class="form-group">

                                    <label>
                                        Company / Organization
                                    </label>

                                    <input
                                        type="text"
                                        class="form-control exp-company"
                                        value="${this.escapeAttribute(experience.company || "")}"
                                        placeholder="Company Name"
                                    >

                                </div>


                                <div class="form-group col-span-2">

                                    <label>
                                        Duration / Date Range
                                    </label>

                                    <input
                                        type="text"
                                        class="form-control exp-duration"
                                        value="${this.escapeAttribute(experience.duration || "")}"
                                        placeholder="Jun 2025 - Present"
                                    >

                                </div>


                                <div class="form-group col-span-2">

                                    <label>
                                        Responsibilities & Achievements
                                    </label>

                                    <textarea
                                        class="form-control exp-desc"
                                        rows="3"
                                        placeholder="Describe your real responsibilities and achievements..."
                                    >${this.escapeHtml(experience.description || "")}</textarea>

                                </div>

                            </div>

                        </div>
                    `
                )
                .join("");
    }


    addExperienceField() {

        this.profileData.experience.push({

            role: "",
            company: "",
            duration: "",
            description: ""

        });

        this.renderExperienceList();
    }


    removeExperience(index) {

        this.profileData.experience.splice(
            index,
            1
        );

        this.renderExperienceList();

        this.calculateCompleteness();
    }


    // ==========================================
    // SAVE PROFILE
    // ==========================================

    async saveProfile() {

        const getValue = id => {

            const element =
                document.getElementById(id);

            return element
                ? element.value.trim()
                : "";
        };


        // Personal data

        this.profileData.fullName =
            getValue("profFullName");

        this.profileData.email =
            getValue("profEmail");

        this.profileData.phone =
            getValue("profPhone");

        this.profileData.location =
            getValue("profLocation");

        this.profileData.linkedin =
            getValue("profLinkedin");

        this.profileData.github =
            getValue("profGithub");

        this.profileData.website =
            getValue("profWebsite");

        this.profileData.objective =
            getValue("profObjective");

        this.profileData.certifications =
            getValue("profCertifications");

        this.profileData.achievements =
            getValue("profAchievements");

        this.profileData.languages =
            getValue("profLanguages");

        this.profileData.interests =
            getValue("profInterests");


        // ==========================================
        // EDUCATION
        // ==========================================

        const educationCards =
            document.querySelectorAll(
                "#educationListContainer .dynamic-item-card"
            );


        this.profileData.education =
            Array.from(educationCards)
                .map(card => {

                    const level =
                        card.querySelector(
                            ".edu-level"
                        )?.value || "";


                    const institution =
                        card.querySelector(
                            ".edu-institution"
                        )?.value.trim() || "";


                    const course =
                        card.querySelector(
                            ".edu-course"
                        )?.value.trim() || "";


                    const specialization =
                        card.querySelector(
                            ".edu-specialization"
                        )?.value.trim() || "";


                    const cgpa =
                        card.querySelector(
                            ".edu-cgpa"
                        )?.value.trim() || "";


                    const duration =
                        card.querySelector(
                            ".edu-duration"
                        )?.value.trim() || "";


                    return {

                        level,

                        institution,

                        course,

                        specialization,

                        cgpa,

                        duration,

                        /*
                         * Keep degree for compatibility
                         * with existing resumeBuilder.js
                         */
                        degree:
                            level === "Graduation"
                                ? course
                                : level
                    };

                });


        // ==========================================
        // PROJECTS
        // ==========================================

        const projectCards =
            document.querySelectorAll(
                "#projectsListContainer .dynamic-item-card"
            );


        this.profileData.projects =
            Array.from(projectCards)
                .map(card => ({

                    title:
                        card.querySelector(
                            ".proj-title"
                        )?.value.trim() || "",

                    description:
                        card.querySelector(
                            ".proj-desc"
                        )?.value.trim() || "",

                    tech:
                        card.querySelector(
                            ".proj-tech"
                        )?.value.trim() || "",

                    github:
                        card.querySelector(
                            ".proj-github"
                        )?.value.trim() || ""

                }));


        // ==========================================
        // EXPERIENCE
        // ==========================================

        const experienceCards =
            document.querySelectorAll(
                "#experienceListContainer .dynamic-item-card"
            );


        this.profileData.experience =
            Array.from(experienceCards)
                .map(card => ({

                    role:
                        card.querySelector(
                            ".exp-role"
                        )?.value.trim() || "",

                    company:
                        card.querySelector(
                            ".exp-company"
                        )?.value.trim() || "",

                    duration:
                        card.querySelector(
                            ".exp-duration"
                        )?.value.trim() || "",

                    description:
                        card.querySelector(
                            ".exp-desc"
                        )?.value.trim() || ""

                }));


        // ==========================================
        // LOCAL STORAGE
        // ==========================================

        localStorage.setItem(
            "careerpilot_profile",
            JSON.stringify(this.profileData)
        );


        this.calculateCompleteness();


        // ==========================================
        // SQLITE
        // ==========================================

        try {

            const response =
                await fetch(
                    "/api/profile",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                this.profileData
                            )
                    }
                );


            const data =
                await response.json();


            if (!response.ok || !data.success) {

                throw new Error(
                    data.message ||
                    "Profile save failed."
                );
            }


            this.profileData =
                data.profile ||
                this.profileData;


            localStorage.setItem(
                "careerpilot_profile",
                JSON.stringify(
                    this.profileData
                )
            );


            // Sync resume builder

            if (window.resumeBuilder) {

                resumeBuilder.resumeData =
                    JSON.parse(
                        JSON.stringify(
                            this.profileData
                        )
                    );

                resumeBuilder.populateEditFields();

                resumeBuilder.renderPreview();
            }


            if (app.renderUserNav) {
                app.renderUserNav();
            }


            app.showToast(
                "Profile saved successfully!",
                "success"
            );

        }
        catch (error) {

            console.error(
                "Profile save error:",
                error
            );

            app.showToast(
                "Could not save profile to server.",
                "error"
            );
        }
    }


    // ==========================================
    // COMPLETENESS
    // ==========================================

    calculateCompleteness() {

        let score = 0;


        if (this.profileData.fullName)
            score += 15;


        if (this.profileData.objective)
            score += 15;


        if (
            this.profileData.skills.length >= 5
        )
            score += 20;


        if (
            this.profileData.education.length >= 1
        )
            score += 15;


        if (
            this.profileData.projects.length >= 1
        )
            score += 15;


        if (
            this.profileData.experience.length >= 1
        )
            score += 10;


        if (
            this.profileData.certifications
        )
            score += 10;


        score = Math.min(
            100,
            score
        );


        const percent =
            document.getElementById(
                "profileCompletenessPercent"
            );

        const fill =
            document.getElementById(
                "profileCompletenessFill"
            );


        if (percent) {
            percent.textContent =
                `${score}%`;
        }


        if (fill) {
            fill.style.width =
                `${score}%`;
        }


        const sidebarScore =
            document.getElementById(
                "sidebarReadinessScore"
            );

        const sidebarFill =
            document.getElementById(
                "sidebarReadinessFill"
            );


        if (sidebarScore) {
            sidebarScore.textContent =
                `${score}%`;
        }


        if (sidebarFill) {
            sidebarFill.style.width =
                `${score}%`;
        }
    }


    // ==========================================
    // HTML SAFETY
    // ==========================================

    escapeHtml(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    escapeAttribute(value) {

        return this.escapeHtml(value);
    }
}


// ==========================================
// SINGLETON
// ==========================================

const profileManager =
    new ProfileManager();


document.addEventListener(
    "DOMContentLoaded",
    () => {

        profileManager.render();

    }
);
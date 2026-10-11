# 🚀 CareerPilot AI — Codebase & Folder Structure Documentation

Welcome to the **CareerPilot AI** repository! This document provides an exhaustive, directory-by-directory, and file-by-file breakdown of the entire project, explaining **in which folder which file is present, what code is inside each file, and concrete code examples (`Ex:`)** showing how each part functions.

---

## 📑 Table of Contents

1. [Project Overview](#-project-overview)
2. [Complete Directory Tree](#-complete-directory-tree)
3. [Root Directory](#-root-directory)
4. [Backend Core (`CarrerPilot-AI/`)](#-backend-core-carrerpilot-ai)
5. [Database Models (`CarrerPilot-AI/models/`)](#-database-models-carrerpilot-aimodels)
6. [API Routes & Blueprints (`CarrerPilot-AI/routes/`)](#-api-routes--blueprints-carrerpilot-airoutes)
7. [Services (`CarrerPilot-AI/services/`)](#-services-carrerpilot-aiservices)
8. [Frontend Templates (`CarrerPilot-AI/templates/`)](#-frontend-templates-carrerpilot-aitemplates)
9. [Static Styles & Assets (`CarrerPilot-AI/static/css/` & `images/`)](#-static-styles--assets)
10. [Frontend JavaScript Controllers (`CarrerPilot-AI/static/js/`)](#-frontend-javascript-controllers-carrerpilot-aistaticjs)
11. [Database Schema (`careerpilot.db`)](#-database-schema-careerpilotdb)
12. [How to Run the Application](#-how-to-run-the-application)

---

## 🌟 Project Overview

**CareerPilot AI** is an all-in-one, AI-powered career acceleration platform built with a **Flask (Python)** backend, **SQLite** database, and modern **Vanilla JavaScript (ES6+ / SPA)** frontend styled with custom CSS and animated components.

### Core Capabilities:
- 🔐 **Authentication & Role-Based UI**: Job seeker & Administrator roles with custom theme switching.
- 👤 **Interactive Profile Manager**: Manages personal info, education, skills, experience, and custom avatar upload.
- 📄 **ATS Resume Builder**: Live multi-template resume builder with PDF export (`html2pdf.js`).
- 🤖 **Gemini AI Resume Optimization**: Enhances profile bullet points and formatting using Google's `gemini-2.5-flash` model.
- 📊 **ATS Resume Analyzer**: Keyword scanning, match-rate scoring, and Chart.js visualizations.
- 🎙️ **AI Mock Interview Studio**: Speech-to-Text (STT) and Text-to-Speech (TTS) interactive interview simulation across multiple job roles.
- 🌐 **Public Shareable Profile**: Dynamic portfolio with QR code generation (`qrcodejs`).
- 🛡️ **Admin Panel**: User listing, activity analytics, and account status controls.

---

## 🌳 Complete Directory Tree

```
CareerPilot-AI new/
│
├── requirements.txt                          # Top-level Python dependency specifications
│
└── CarrerPilot-AI/                           # Main Application Root
    ├── .env                                  # Environment secrets (GEMINI_API_KEY, etc.)
    ├── .gitignore                            # Git exclusion rules
    ├── app.py                                # Main Flask server entry point & route definitions
    ├── config.py                             # Configuration loader from environment variables
    ├── careerpilot.db                        # SQLite database file storing users & profiles
    ├── requirements.txt                      # Project Python dependencies
    │
    ├── models/                               # Database access layer
    │   ├── __init__.py                       # Package initializer
    │   └── database.py                       # SQLite connection helper function
    │
    ├── routes/                               # Flask Blueprints & REST API endpoints
    │   ├── __init__.py                       # Package initializer
    │   ├── auth.py                           # User Auth (signup, login, session) & Profile APIs
    │   └── resume.py                         # Gemini AI ATS Resume Generator API
    │
    ├── services/                             # Business logic & external service helpers
    │   └── __init__.py                       # Package initializer
    │
    ├── templates/                            # Jinja2 HTML templates
    │   ├── index.html                        # Main Single Page Application interface
    │   └── public_profile.html               # Public shareable profile & portfolio page
    │
    └── static/                               # Static assets served to the client
        ├── css/
        │   └── styles.css                    # Global application CSS, themes, and layouts
        │
        ├── images/                           # SVG Avatars and icons
        │   ├── avatar-admin.svg              # Default avatar for Admin users
        │   ├── avatar-female.svg             # Default avatar for female candidates
        │   └── avatar-male.svg               # Default avatar for male candidates
        │
        ├── uploads/
        │   └── profile_images/               # Uploaded user profile photos (e.g. user_1.jpg)
        │
        └── js/                               # Frontend controller scripts (ES6 Classes)
            ├── adminPanel.js                 # Admin management table & filter controller
            ├── app.js                        # Main SPA controller, auth gateway & hash routing
            ├── dashboard.js                  # Analytics charts & career readiness metrics
            ├── mockInterview.js              # Voice AI mock interview studio & radar report
            ├── profileManager.js             # User profile state, form sync & photo upload
            ├── resumeAnalyzer.js             # ATS resume text analyzer & scoring engine
            ├── resumeBuilder.js              # Live multi-template resume builder & PDF export
            └── script.js                     # Auxiliary script placeholder
```

---

## 📁 Root Directory

### 📄 `requirements.txt`
- **Location**: Root directory (`/requirements.txt`)
- **What is inside**: Python package requirements defining the dependencies needed across environments.
- **Key packages listed**:
  - `Flask==3.1.3`: Web framework.
  - `google-genai==2.25.0`: Official Google Gemini AI SDK.
  - `python-dotenv==1.2.3`: Reads `.env` configuration files.
  - `Werkzeug==3.1.9`: WSGI utilities and password hashing.
  - `requests`, `httpx`, `cryptography`, `pydantic`.

**Ex: Installing root dependencies**
```bash
pip install -r requirements.txt
```

---

## 📁 Backend Core (`CarrerPilot-AI/`)

### 1. 📄 `CarrerPilot-AI/app.py`
- **Location**: `CarrerPilot-AI/app.py`
- **Purpose**: The main backend entry point. Configures the Flask application, registers blueprints, initializes the SQLite database tables, and serves frontend web pages.
- **Code components**:
  - `app = Flask(__name__)`: Initializes the Flask app instance.
  - `app.secret_key`: Sets session cookie secret key.
  - `app.register_blueprint(auth)`: Mounts authentication and profile routes.
  - `app.register_blueprint(resume)`: Mounts Gemini AI resume generation routes.
  - `@app.route("/") -> home()`: Renders the primary single-page app `index.html`.
  - `@app.route("/profile/<username>") -> public_profile()`: Serves public profile view.
  - `init_db()`: Creates the `users` and `profiles` tables if they do not already exist.
  - `if __name__ == "__main__": init_db(); app.run(debug=True)`: Starts development server on port 5000.

**Ex: Code excerpt from `app.py`**
```python
from flask import Flask, render_template
from routes.auth import auth
from routes.resume import resume
from models.database import get_db_connection

app = Flask(__name__)
app.secret_key = "careerpilot-secret-key"

app.register_blueprint(auth)
app.register_blueprint(resume)

@app.route("/")
def home():
    return render_template("index.html")

def init_db():
    connection = get_db_connection()
    connection.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'jobseeker',
            gender TEXT DEFAULT 'female',
            title TEXT DEFAULT 'Candidate',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    # ... profiles table creation
    connection.commit()
    connection.close()

if __name__ == "__main__":
    init_db()
    app.run(debug=True)
```

---

### 2. 📄 `CarrerPilot-AI/config.py`
- **Location**: `CarrerPilot-AI/config.py`
- **Purpose**: Centralized application configuration. Loads environment variables from `.env` using `python-dotenv`.
- **Code components**:
  - `class Config`:
    - `SECRET_KEY`: Read from `os.getenv("SECRET_KEY")` with default fallback.
    - `GEMINI_API_KEY`: Read from `os.getenv("GEMINI_API_KEY")`.

**Ex: Code excerpt from `config.py`**
```python
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "careerpilot-secret-key")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
```

---

### 3. 📄 `CarrerPilot-AI/.env`
- **Location**: `CarrerPilot-AI/.env`
- **Purpose**: Local environment configuration storing sensitive API keys and secrets.
- **Variables stored**:
  - `GEMINI_API_KEY`: Google Gemini API key used by `routes/resume.py`.
  - `SECRET_KEY`: Flask secret key for signing session cookies.

**Ex: `.env` file structure**
```ini
GEMINI_API_KEY=AIzaSyYourGeminiApiKeyHere
SECRET_KEY=careerpilot-secret-key
```

---

### 4. 📄 `CarrerPilot-AI/.gitignore`
- **Location**: `CarrerPilot-AI/.gitignore`
- **Purpose**: Prevents virtual environments, temporary cache files, `.env` secrets, and database binaries from being committed to version control.

**Ex: Standard contents**
```gitignore
venv/
.venv/
.env
__pycache__/
*.pyc
careerpilot.db
```

---

## 📁 Database Models (`CarrerPilot-AI/models/`)

### 1. 📄 `models/__init__.py`
- **Location**: `CarrerPilot-AI/models/__init__.py`
- **Purpose**: Python package marker allowing imports like `from models.database import get_db_connection`.

---

### 2. 📄 `models/database.py`
- **Location**: `CarrerPilot-AI/models/database.py`
- **Purpose**: Provides a reusable database connection factory for the SQLite database.
- **Code components**:
  - `DATABASE = "careerpilot.db"`: Path to SQLite file.
  - `get_db_connection()`: Connects to SQLite and assigns `connection.row_factory = sqlite3.Row`, enabling column name indexing (e.g. `row["email"]`).

**Ex: Code excerpt from `database.py`**
```python
import sqlite3

DATABASE = "careerpilot.db"

def get_db_connection():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection
```

---

## 📁 API Routes & Blueprints (`CarrerPilot-AI/routes/`)

### 1. 📄 `routes/__init__.py`
- **Location**: `CarrerPilot-AI/routes/__init__.py`
- **Purpose**: Python package marker allowing imports like `from routes.auth import auth`.

---

### 2. 📄 `routes/auth.py`
- **Location**: `CarrerPilot-AI/routes/auth.py`
- **Purpose**: Handles authentication (signup, login, logout, session check) and candidate profile persistence (fetch, update, avatar photo upload).
- **Code components & Endpoints**:
  1. `POST /api/auth/signup`:
     - Reads `name`, `email`, `password`, `gender`.
     - Validates unique email against `users` table.
     - Automatically sets `role = "admin"` if `"admin"` is present in email address, else `"jobseeker"`.
     - Hashes password using `werkzeug.security.generate_password_hash`.
     - Stores user in session `session["user_id"] = user_id`.
  2. `POST /api/auth/login`:
     - Looks up user by email.
     - Verifies password with `check_password_hash`.
     - Sets session cookie and returns user JSON.
  3. `POST /api/auth/logout`:
     - Calls `session.clear()`.
  4. `GET /api/auth/me`:
     - Returns current logged-in user state or `{ isLoggedIn: false }`.
  5. `GET /api/profile`:
     - Fetches JSON from `profiles` table for `session["user_id"]`.
     - Falls back to default candidate/admin template if not yet saved.
  6. `POST /api/profile`:
     - Validates and upserts user profile JSON to `profiles` table.
  7. `POST /api/profile/avatar`:
     - Accepts file upload (`multipart/form-data`) under field name `profileImage`.
     - Validates extensions (`png`, `jpg`, `jpeg`, `webp`).
     - Saves file to `static/uploads/profile_images/user_<id>.<ext>`.
     - Updates `avatarUrl` in the user's saved profile JSON.

**Ex: Calling the Signup and Profile APIs**
```javascript
// Example: Frontend Signup Request
const signupResponse = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        name: "Jane Doe",
        email: "jane.doe@example.com",
        password: "securePassword123",
        gender: "female"
    })
});
const data = await signupResponse.json();
console.log(data.user); // { id: 1, name: "Jane Doe", role: "jobseeker", ... }
```

---

### 3. 📄 `routes/resume.py`
- **Location**: `CarrerPilot-AI/routes/resume.py`
- **Purpose**: Integrates with Google's Gemini AI to analyze the user's profile and generate an ATS-tailored resume without hallucinating fake jobs or degrees.
- **Code components & Endpoints**:
  - `POST /api/resume/generate`:
    - Requires authenticated session (`session.get("user_id")`).
    - Receives `targetRole`, `experienceLevel`, and `profile` JSON.
    - Uses `google.genai.Client` with model `gemini-2.5-flash`.
    - Prompts Gemini with strict ATS guardrails (no fake companies, no invented projects, optimize real wording).
    - Strips markdown code fences (````json ... ````) and returns parsed JSON.

**Ex: AI Resume Generation Endpoint Execution**
```python
# Server-side snippet from routes/resume.py
@resume.route("/api/resume/generate", methods=["POST"])
def generate_resume():
    # ... checks session & input
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    prompt = f"""
    You are an expert ATS resume optimization assistant.
    TARGET JOB ROLE: {target_role}
    USER PROFILE: {json.dumps(profile)}
    Return ONLY valid JSON with keys: headline, objective, skills, experience, projects, education.
    """
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    return jsonify({"success": True, "resume": json.loads(response.text)})
```

---

## 📁 Services (`CarrerPilot-AI/services/`)

### 1. 📄 `services/__init__.py`
- **Location**: `CarrerPilot-AI/services/__init__.py`
- **Purpose**: Package initializer reserved for background worker services, third-party integrations, and analytics extractors.

---

## 📁 Frontend Templates (`CarrerPilot-AI/templates/`)

### 1. 📄 `templates/index.html`
- **Location**: `CarrerPilot-AI/templates/index.html`
- **Purpose**: The core Single-Page Application (SPA) HTML file containing all layout panels, navigation, and modal dialogues.
- **Key Sections inside**:
  - `<div id="authGatewayView">`: Split-screen authentication landing with animated hero visuals and Login/Signup tabs.
  - `<nav id="appNavbar">`: Sticky top bar with brand icon, active user role indicator, notification center dropdown, and theme toggler.
  - `<aside class="sidebar">`: Left navigation bar with links:
    - `#dashboard` (Overview)
    - `#profile` (Profile Editor)
    - `#builder` (ATS Resume Builder)
    - `#analyzer` (Resume Checker)
    - `#interview` (AI Mock Interview)
    - `#admin` (System Administrator Panel - admin only)
  - `<main class="main-content">`: Dynamic view switch container holding each feature's panels and controls.
  - External CDN scripts included:
    - `Chart.js`: Data visualizations.
    - `html2pdf.js`: Client-side high-resolution PDF rendering.
    - `qrcode.js`: QR code generator for profile sharing.
    - `canvas-confetti`: Celebratory animations upon milestone completion.

**Ex: View Switching Structure in `index.html`**
```html
<section id="view-dashboard" class="app-view active">
    <!-- Career readiness score, radar charts, and trend line -->
</section>
<section id="view-builder" class="app-view">
    <!-- Live resume editor and template preview canvas -->
</section>
```

---

### 2. 📄 `templates/public_profile.html`
- **Location**: `CarrerPilot-AI/templates/public_profile.html`
- **Purpose**: Public-facing portfolio page rendered when external recruiters or peers visit `/profile/<username>`.
- **Key Sections inside**:
  - Hero Card: Profile photo, candidate title, location, LinkedIn/GitHub links.
  - Dynamic QR Code: Generated using `qrcodejs` so recruiters can scan and open on mobile devices.
  - Objective & Skills Tags: Badges for verified technical skills.
  - Experience & Education Timelines: Formatted timeline cards.
  - Download Button: Uses `html2pdf.js` to download the public profile as a clean PDF resume.

---

## 📁 Static Styles & Assets

### 1. 📄 `static/css/styles.css`
- **Location**: `CarrerPilot-AI/static/css/styles.css`
- **Purpose**: Complete design system stylesheet with custom properties, responsive breakpoints, dark/light theme variables, and custom color accents.
- **Key Styling features**:
  - CSS Custom Properties (`--bg-primary`, `--card-bg`, `--primary`, `--accent`).
  - Role-based theming (`[data-user-role="admin"]` triggers orange/red accents; `[data-user-role="jobseeker"]` triggers indigo/purple accents).
  - Glassmorphic panels with background blur and borders.
  - Print styles (`@media print`) ensuring PDF export is pixel-perfect.

---

### 2. 📁 `static/images/`
- **Location**: `CarrerPilot-AI/static/images/`
- **Files**:
  - `avatar-admin.svg`: Vector shield/admin avatar icon used for administrator accounts.
  - `avatar-female.svg`: Vector profile avatar for female candidates.
  - `avatar-male.svg`: Vector profile avatar for male candidates.

---

### 3. 📁 `static/uploads/profile_images/`
- **Location**: `CarrerPilot-AI/static/uploads/profile_images/`
- **Purpose**: Server storage directory where user-uploaded photos (e.g. `user_1.png`) are written and served via `/static/uploads/profile_images/<filename>`.

---

## 📁 Frontend JavaScript Controllers (`CarrerPilot-AI/static/js/`)

### 1. 📄 `static/js/app.js` (`Application` class)
- **Location**: `CarrerPilot-AI/static/js/app.js`
- **Purpose**: Orchestrates global application state, authentication gateway transitions, URL hash routing, role-based theming, and toast alerts.
- **Key Methods**:
  - `init()`: Starts app, binds URL hash changes (`window.addEventListener('hashchange')`), loads theme.
  - `showAuthGateway()` / `showAppLayout()`: Controls gateway vs dashboard visibility.
  - `applyUserRoleTheme(role)`: Sets `document.documentElement[data-user-role]`.
  - `navigateTo(viewId)`: Activates the requested view section and syncs hash.
  - `showToast(msg, type)`: Displays floating alert badges.

**Ex: Navigation Routing in `app.js`**
```javascript
navigateTo(viewId, updateHash = true) {
    document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById(`view-${viewId}`);
    if (target) target.classList.add('active');
    if (updateHash) window.location.hash = viewId;
}
```

---

### 2. 📄 `static/js/profileManager.js` (`ProfileManager` class)
- **Location**: `CarrerPilot-AI/static/js/profileManager.js`
- **Purpose**: Manages full candidate profile data, interactive form fields, multi-item lists (Education, Projects, Experience, Skills), and image uploading.
- **Key Methods**:
  - `getDefaultData(user)`: Generates empty profile schema with appropriate avatar.
  - `render()`: Populates form input fields and lists with current profile state.
  - `saveProfile()`: Sends `POST /api/profile` to persist profile JSON into SQLite.
  - `uploadAvatar(file)`: Sends `FormData` with `profileImage` to `POST /api/profile/avatar`.
  - `addSkill(skill)` / `removeSkill(index)`: Manages skills tags array.
  - `addEducation()` / `addExperience()` / `addProject()`: Appends new dynamic entries.

**Ex: Avatar Upload in `profileManager.js`**
```javascript
async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('profileImage', file);
    const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData
    });
    const result = await res.json();
    if (result.success) {
        this.profileData.avatarUrl = result.avatarUrl;
        this.render();
    }
}
```

---

### 3. 📄 `static/js/resumeBuilder.js` (`ResumeBuilder` class)
- **Location**: `CarrerPilot-AI/static/js/resumeBuilder.js`
- **Purpose**: Live multi-template ATS resume builder with real-time preview and AI optimization trigger.
- **Key Methods**:
  - `syncFromProfile()`: Clones user profile from `profileManager` into local resume state.
  - `render()`: Generates live resume preview using the selected template (`modern`, `classic`, `minimal`, `executive`).
  - `generateWithAI()`: Calls `/api/resume/generate` with current profile and target job title, updating resume sections with ATS-optimized bullet points.
  - `downloadPDF()`: Calls `html2pdf()` on the preview DOM element to export formatted PDF.

**Ex: Calling AI Optimizer in `resumeBuilder.js`**
```javascript
async generateWithAI() {
    const targetRole = document.getElementById('builderTargetRole').value;
    const res = await fetch('/api/resume/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            targetRole: targetRole,
            experienceLevel: 'Mid-Level',
            profile: this.resumeData
        })
    });
    const data = await res.json();
    if (data.success) {
        Object.assign(this.resumeData, data.resume);
        this.render();
    }
}
```

---

### 4. 📄 `static/js/resumeAnalyzer.js` (`ResumeAnalyzer` class)
- **Location**: `CarrerPilot-AI/static/js/resumeAnalyzer.js`
- **Purpose**: ATS Resume Checker that scans uploaded resume files (TXT) or pasted text against target job descriptions.
- **Key Methods**:
  - `initATSForm()`: Binds file input submission and validates content length.
  - `calculateScore(text, role)`: Computes keyword match rate, structure score, and missing technical keywords.
  - `renderCharts(scoreData)`: Renders Chart.js Doughnut (Overall Score) and Radar (Competency breakdown) charts.

**Ex: Parsing and scoring in `resumeAnalyzer.js`**
```javascript
const file = fileInput.files[0];
const text = await file.text();
let score = 72;
if (text.toLowerCase().includes('python')) score += 5;
if (text.toLowerCase().includes('sql')) score += 4;
// Renders Doughnut chart with final score
```

---

### 5. 📄 `static/js/mockInterview.js` (`MockInterview` class)
- **Location**: `CarrerPilot-AI/static/js/mockInterview.js`
- **Purpose**: Voice-enabled AI Mock Interview Studio with built-in Speech-to-Text (STT) and Text-to-Speech (TTS).
- **Key Methods**:
  - `questionBank`: Built-in technical and behavioral questions across roles (`Software Engineer`, `Full Stack Developer`, `Data Scientist`, `Product Manager`, `Cybersecurity Analyst`, `UI/UX Designer`, `HR`).
  - `startInterview(role)`: Initializes multi-step interview session.
  - `speakQuestion(text)`: Uses browser `window.speechSynthesis` to speak questions aloud.
  - `toggleRecording()`: Uses browser `webkitSpeechRecognition` to transcribe candidate's voice answers in real-time.
  - `generateReport()`: Calculates multi-metric scores (Relevance, Communication, Technical Depth) and renders Chart.js diagnostic report.

**Ex: Speech Synthesis & Recognition in `mockInterview.js`**
```javascript
// Speech Synthesis (TTS)
speakQuestion(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
}

// Speech Recognition (STT)
initRecognition() {
    this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        document.getElementById('interviewAnswerBox').value += ' ' + transcript;
    };
}
```

---

### 6. 📄 `static/js/dashboard.js` (`Dashboard` class)
- **Location**: `CarrerPilot-AI/static/js/dashboard.js`
- **Purpose**: User home analytics dashboard displaying overall career readiness index, historical ATS trends, and goal tracking.
- **Key Methods**:
  - `renderCharts()`:
    - Doughnut chart: Readiness percentage (e.g. 84%).
    - Line chart: ATS score trend across weekly iterations.
  - `renderGoals()`: Interactive checklist for interview milestones and resume improvements.
  - `renderActivityLog()`: Recent user action stream.

---

### 7. 📄 `static/js/adminPanel.js` (`AdminPanel` class)
- **Location**: `CarrerPilot-AI/static/js/adminPanel.js`
- **Purpose**: Administrator management interface for viewing candidate accounts, verifying ATS metrics, and toggling user account status.
- **Key Methods**:
  - `render()`: Queries `/api/admin/users` or renders candidate directory.
  - `filterUsers()`: Live search filtering across candidate names and emails.
  - `toggleStatus(userId)`: Activates or deactivates user accounts.

---

### 8. 📄 `static/js/script.js`
- **Location**: `CarrerPilot-AI/static/js/script.js`
- **Purpose**: Lightweight supplementary script entry point for custom extensions or standalone utility scripts.

---

## 🗄️ Database Schema (`careerpilot.db`)

The SQLite database contains two core tables initialized by `app.py`:

```
┌────────────────────────────────────────────────────────┐
│                        users                           │
├────────────────────┬──────────────┬────────────────────┤
│ Column             │ Type         │ Constraints        │
├────────────────────┼──────────────┼────────────────────┤
│ id                 │ INTEGER      │ PRIMARY KEY AUTO   │
│ name               │ TEXT         │ NOT NULL           │
│ email              │ TEXT         │ UNIQUE, NOT NULL   │
│ password           │ TEXT         │ NOT NULL (hashed)  │
│ role               │ TEXT         │ DEFAULT 'jobseeker'│
│ gender             │ TEXT         │ DEFAULT 'female'   │
│ title              │ TEXT         │ DEFAULT 'Candidate'│
│ created_at         │ TIMESTAMP    │ CURRENT_TIMESTAMP  │
└────────────────────┴──────────────┴────────────────────┘
                           │ 1
                           │
                           │ 1 (Foreign Key: user_id)
                           ▼
┌────────────────────────────────────────────────────────┐
│                       profiles                         │
├────────────────────┬──────────────┬────────────────────┤
│ Column             │ Type         │ Constraints        │
├────────────────────┼──────────────┼────────────────────┤
│ id                 │ INTEGER      │ PRIMARY KEY AUTO   │
│ user_id            │ INTEGER      │ UNIQUE, REFERENCES │
│ profile_data       │ TEXT (JSON)  │ NOT NULL           │
│ created_at         │ TIMESTAMP    │ CURRENT_TIMESTAMP  │
│ updated_at         │ TIMESTAMP    │ CURRENT_TIMESTAMP  │
└────────────────────┴──────────────┴────────────────────┘
```

**Ex: Sample JSON stored inside `profile_data`**
```json
{
  "fullName": "Alex Johnson",
  "email": "alex.johnson@email.com",
  "gender": "male",
  "avatarUrl": "/static/images/avatar-male.svg",
  "headline": "Full-Stack Engineer & AI Enthusiast",
  "skills": ["Python", "Flask", "JavaScript", "SQLite", "Docker"],
  "education": [
    {
      "institution": "State University",
      "degree": "B.S. in Computer Science",
      "year": "2024"
    }
  ],
  "experience": [
    {
      "role": "Software Engineering Intern",
      "company": "Tech Corp",
      "duration": "2023 - 2024",
      "details": "Engineered REST APIs and improved latency by 25%."
    }
  ]
}
```

---

## 🚀 How to Run the Application

### 1. Prerequisites
- Python 3.10+ installed
- A Google Gemini API key ([Google AI Studio](https://aistudio.google.com/))

### 2. Setup Virtual Environment
```bash
# Navigate to the inner application folder
cd "CarrerPilot-AI"

# Create a virtual environment
python -m venv venv

# Activate virtual environment (Windows PowerShell)
.\venv\Scripts\Activate.ps1
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Create or verify `.env` inside `CarrerPilot-AI/`:
```ini
GEMINI_API_KEY=your_actual_gemini_api_key_here
SECRET_KEY=careerpilot-secret-key
```

### 5. Launch the Server
```bash
python app.py
```
- Open your browser and navigate to: **`http://127.0.0.1:5000`**
- To test the Admin theme and Admin panel, sign up with an email containing `admin` (e.g. `admin@careerpilot.ai`).

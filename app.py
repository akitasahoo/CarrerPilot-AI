from flask import Flask, render_template, session, redirect, url_for
import os
from pathlib import Path
from dotenv import load_dotenv

from routes.auth import auth
from routes.resume import resume
from models.database import get_db_connection


# =========================
# ENVIRONMENT CONFIGURATION
# =========================

load_dotenv()

app = Flask(__name__)

app.secret_key = os.getenv("SECRET_KEY")

if not app.secret_key:
    raise RuntimeError(
        "SECRET_KEY is missing from the .env file."
    )


# =========================
# REGISTER BLUEPRINTS
# =========================

app.register_blueprint(auth)
app.register_blueprint(resume)


# =========================
# FRONTEND ROUTES
# =========================

@app.route("/")
def home():
    return render_template("index.html")


@app.route("/profile/<username>")
def public_profile(username):
    return render_template(
        "public_profile.html",
        username=username
    )


# =========================
# DATABASE INITIALIZATION
# =========================

def init_db():
    connection = get_db_connection()

    try:
        # Users table
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

        # User profiles table
        connection.execute("""
            CREATE TABLE IF NOT EXISTS profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER UNIQUE NOT NULL,
                profile_data TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id)
                    REFERENCES users(id)
            )
        """)

        # ATS resume analysis history table
        connection.execute("""
            CREATE TABLE IF NOT EXISTS resume_analyses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                target_role TEXT NOT NULL,
                overall_score INTEGER NOT NULL,
                formatting_score INTEGER NOT NULL,
                keyword_score INTEGER NOT NULL,
                grammar_score INTEGER NOT NULL,
                impact_score INTEGER NOT NULL,
                matched_keywords TEXT NOT NULL,
                missing_skills TEXT NOT NULL,
                suggestions TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id)
                    REFERENCES users(id)
            )
        """)

        connection.commit()
        print("Database initialized successfully.")

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()


# =========================
# RUN APPLICATION
# =========================

if __name__ == "__main__":
    init_db()

    app.run(
        debug=True
    )


from flask import Flask, render_template, session, redirect, url_for

from routes.auth import auth
from models.database import get_db_connection
from routes.resume import resume



app = Flask(__name__)

# Session secret key
app.secret_key = "careerpilot-secret-key"

# Register authentication API routes
app.register_blueprint(auth)
app.register_blueprint(resume)

# =========================
# FRONTEND
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
    connection.execute("""
    CREATE TABLE IF NOT EXISTS profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        profile_data TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
""")

    connection.commit()
    connection.close()


# =========================
# RUN APPLICATION
# =========================

if __name__ == "__main__":

    init_db()

    app.run(debug=True)
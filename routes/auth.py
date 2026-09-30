import os
from werkzeug.utils import secure_filename
from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
import json

from models.database import get_db_connection


auth = Blueprint("auth", __name__)


# ==========================================
# SIGNUP
# ==========================================

@auth.route("/api/auth/signup", methods=["POST"])
def signup():

    data = request.get_json() or {}

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()
    gender = data.get("gender", "female").strip().lower()

    if not name or not email or not password:

        return jsonify({
            "success": False,
            "message": "Name, email, and password are required."
        }), 400

    connection = get_db_connection()

    existing_user = connection.execute(
        "SELECT id FROM users WHERE email = ?",
        (email,)
    ).fetchone()

    if existing_user:

        connection.close()

        return jsonify({
            "success": False,
            "message": "An account with this email already exists."
        }), 400

    role = "admin" if "admin" in email else "jobseeker"

    title = (
        "System Administrator"
        if role == "admin"
        else "Candidate"
    )

    hashed_password = generate_password_hash(password)

    cursor = connection.execute(
        """
        INSERT INTO users
        (name, email, password, role, gender, title)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            name,
            email,
            hashed_password,
            role,
            gender,
            title
        )
    )

    connection.commit()

    user_id = cursor.lastrowid

    connection.close()

    session["user_id"] = user_id

    return jsonify({
        "success": True,
        "message": "Account created successfully!",
        "user": {
            "id": user_id,
            "name": name,
            "email": email,
            "role": role,
            "gender": gender,
            "title": title
        }
    })


# ==========================================
# LOGIN
# ==========================================

@auth.route("/api/auth/login", methods=["POST"])
def login():

    data = request.get_json() or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()

    connection = get_db_connection()

    user = connection.execute(
        """
        SELECT *
        FROM users
        WHERE email = ?
        """,
        (email,)
    ).fetchone()

    connection.close()

    if not user:

        return jsonify({
            "success": False,
            "message": "Invalid email or password."
        }), 401

    if not check_password_hash(user["password"], password):

        return jsonify({
            "success": False,
            "message": "Invalid email or password."
        }), 401

    session["user_id"] = user["id"]

    return jsonify({
        "success": True,
        "message": f"Welcome back, {user['name']}!",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "gender": user["gender"],
            "title": user["title"]
        }
    })


# ==========================================
# LOGOUT
# ==========================================

@auth.route("/api/auth/logout", methods=["POST"])
def logout():

    session.clear()

    return jsonify({
        "success": True,
        "message": "Logged out successfully."
    })


# ==========================================
# CURRENT USER
# ==========================================

@auth.route("/api/auth/me", methods=["GET"])
def current_user():

    user_id = session.get("user_id")

    if not user_id:

        return jsonify({
            "isLoggedIn": False,
            "user": None
        })

    connection = get_db_connection()

    user = connection.execute(
        """
        SELECT *
        FROM users
        WHERE id = ?
        """,
        (user_id,)
    ).fetchone()

    connection.close()

    if not user:

        session.clear()

        return jsonify({
            "isLoggedIn": False,
            "user": None
        })

    return jsonify({
        "isLoggedIn": True,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "gender": user["gender"],
            "title": user["title"]
        }
    })


# ==========================================
# GET CURRENT USER PROFILE
# ==========================================

@auth.route("/api/profile", methods=["GET"])
def get_profile():

    user_id = session.get("user_id")

    if not user_id:

        return jsonify({
            "success": False,
            "message": "Not logged in."
        }), 401

    connection = get_db_connection()

    user = connection.execute(
        """
        SELECT name, email, gender, role, title
        FROM users
        WHERE id = ?
        """,
        (user_id,)
    ).fetchone()

    if not user:

        connection.close()

        return jsonify({
            "success": False,
            "message": "User not found."
        }), 404

    profile = connection.execute(
        """
        SELECT profile_data
        FROM profiles
        WHERE user_id = ?
        """,
        (user_id,)
    ).fetchone()

    if profile:

        data = json.loads(profile["profile_data"])

    else:

        if user["role"] == "admin":
            avatar = "/static/images/avatar-admin.svg"

        elif user["gender"] == "male":
            avatar = "/static/images/avatar-male.svg"

        else:
            avatar = "/static/images/avatar-female.svg"

        data = {

            # Signup data
            "fullName": user["name"],
            "email": user["email"],
            "gender": user["gender"] or "",

            # Automatically selected avatar
            "avatarUrl": avatar,

            # Personal information
            "phone": "",
            "location": "",
            "linkedin": "",
            "github": "",
            "website": "",

            # Career information
            "headline": "",
            "objective": "",

            # Resume information
            "skills": [],
            "education": [],
            "projects": [],
            "experience": [],

            # Additional information
            "certifications": "",
            "achievements": "",
            "languages": "",
            "interests": ""
        }

    connection.close()

    return jsonify(data)


# ==========================================
# SAVE CURRENT USER PROFILE
# ==========================================

@auth.route("/api/profile", methods=["POST"])
def save_profile():

    user_id = session.get("user_id")

    if not user_id:

        return jsonify({
            "success": False,
            "message": "Not logged in."
        }), 401

    data = request.get_json() or {}

    connection = get_db_connection()

    user = connection.execute(
        """
        SELECT name, email, gender
        FROM users
        WHERE id = ?
        """,
        (user_id,)
    ).fetchone()

    if not user:

        connection.close()

        return jsonify({
            "success": False,
            "message": "User not found."
        }), 404

    # Signup details always remain the source of truth
    data["fullName"] = user["name"]
    data["email"] = user["email"]
    data["gender"] = user["gender"] or data.get("gender", "")

    profile_json = json.dumps(data)

    existing = connection.execute(
        """
        SELECT id
        FROM profiles
        WHERE user_id = ?
        """,
        (user_id,)
    ).fetchone()

    if existing:

        connection.execute(
            """
            UPDATE profiles
            SET profile_data = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
            """,
            (
                profile_json,
                user_id
            )
        )

    else:

        connection.execute(
            """
            INSERT INTO profiles
            (user_id, profile_data)
            VALUES (?, ?)
            """,
            (
                user_id,
                profile_json
            )
        )

    connection.commit()
    connection.close()

    return jsonify({
        "success": True,
        "message": "Profile saved successfully!",
        "profile": data
    })
# ==========================================
# PROFILE IMAGE UPLOAD
# ==========================================

@auth.route("/api/profile/avatar", methods=["POST"])
def upload_profile_avatar():

    user_id = session.get("user_id")

    if not user_id:

        return jsonify({
            "success": False,
            "message": "Not logged in."
        }), 401


    if "profileImage" not in request.files:

        return jsonify({
            "success": False,
            "message": "No profile image selected."
        }), 400


    file = request.files["profileImage"]


    if not file or not file.filename:

        return jsonify({
            "success": False,
            "message": "Invalid image."
        }), 400


    allowed_extensions = {
        "png",
        "jpg",
        "jpeg",
        "webp"
    }


    original_name = file.filename

    extension = (
        original_name
        .rsplit(".", 1)[-1]
        .lower()
        if "." in original_name
        else ""
    )


    if extension not in allowed_extensions:

        return jsonify({
            "success": False,
            "message": "Only JPG, JPEG, PNG and WEBP images are allowed."
        }), 400


    safe_extension = extension


    upload_directory = os.path.join(
        "static",
        "uploads",
        "profile_images"
    )


    os.makedirs(
        upload_directory,
        exist_ok=True
    )


    filename = (
        f"user_{user_id}.{safe_extension}"
    )


    filepath = os.path.join(
        upload_directory,
        filename
    )


    # Save image
    file.save(filepath)


    avatar_url = (
        f"/static/uploads/profile_images/{filename}"
    )


    connection = get_db_connection()


    # Get existing profile
    profile = connection.execute(
        """
        SELECT profile_data
        FROM profiles
        WHERE user_id = ?
        """,
        (user_id,)
    ).fetchone()


    if profile:

        profile_data = json.loads(
            profile["profile_data"]
        )

    else:

        user = connection.execute(
            """
            SELECT name, email, gender
            FROM users
            WHERE id = ?
            """,
            (user_id,)
        ).fetchone()


        if not user:

            connection.close()

            return jsonify({
                "success": False,
                "message": "User not found."
            }), 404


        profile_data = {

            "fullName": user["name"],
            "email": user["email"],
            "gender": user["gender"] or "",

            "avatarUrl": avatar_url,

            "phone": "",
            "location": "",
            "linkedin": "",
            "github": "",
            "website": "",

            "headline": "",
            "objective": "",

            "skills": [],
            "education": [],
            "projects": [],
            "experience": [],

            "certifications": "",
            "achievements": "",
            "languages": "",
            "interests": ""
        }


    profile_data["avatarUrl"] = avatar_url


    profile_json = json.dumps(
        profile_data
    )


    if profile:

        connection.execute(
            """
            UPDATE profiles
            SET profile_data = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
            """,
            (
                profile_json,
                user_id
            )
        )

    else:

        connection.execute(
            """
            INSERT INTO profiles
            (
                user_id,
                profile_data
            )
            VALUES (?, ?)
            """,
            (
                user_id,
                profile_json
            )
        )


    connection.commit()
    connection.close()


    return jsonify({

        "success": True,

        "message":
            "Profile image uploaded successfully.",

        "avatarUrl":
            avatar_url
    })
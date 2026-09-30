from flask import Blueprint, request, jsonify, session
import json
import os

from google import genai


resume = Blueprint("resume", __name__)


# ==========================================
# AI RESUME GENERATOR
# ==========================================

@resume.route("/api/resume/generate", methods=["POST"])
def generate_resume():

    # --------------------------------------
    # Check login
    # --------------------------------------

    user_id = session.get("user_id")

    if not user_id:
        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    # --------------------------------------
    # Get request data
    # --------------------------------------

    data = request.get_json() or {}

    target_role = data.get(
        "targetRole",
        ""
    ).strip()

    experience_level = data.get(
        "experienceLevel",
        ""
    ).strip()

    profile = data.get(
        "profile",
        {}
    )

    # --------------------------------------
    # Validate target role
    # --------------------------------------

    if not target_role:

        return jsonify({
            "success": False,
            "message": "Target job role is required."
        }), 400

    # --------------------------------------
    # Get Gemini API key
    # --------------------------------------

    api_key = os.getenv(
        "GEMINI_API_KEY"
    )

    if not api_key:

        return jsonify({
            "success": False,
            "message": "Gemini API key is not configured."
        }), 500

    # --------------------------------------
    # Gemini AI
    # --------------------------------------

    try:

        client = genai.Client(
            api_key=api_key
        )

        prompt = f"""
You are an expert ATS resume optimization assistant.

Your task is to improve the user's existing resume
for the target job role.

TARGET JOB ROLE:
{target_role}

EXPERIENCE LEVEL:
{experience_level}

USER PROFILE:
{json.dumps(profile, indent=2)}

IMPORTANT RULES:

1. Use ONLY information present in the user's profile.

2. NEVER invent a company.

3. NEVER invent a university or college.

4. NEVER invent a job.

5. NEVER invent an internship.

6. NEVER invent a project.

7. NEVER invent dates.

8. NEVER invent certifications.

9. NEVER invent achievements.

10. NEVER invent skills that are not already
    present in the user's profile.

11. NEVER change the user's name.

12. NEVER change the user's email.

13. NEVER create fake experience.

14. Improve the wording of existing information
    so that it is professional and ATS-friendly.

15. You may reorganize existing skills
    for better relevance.

16. If information is missing, keep that section empty.

17. The purpose is to OPTIMIZE the real profile,
    not create fictional information.

Return ONLY valid JSON.

Use exactly this structure:

{{
    "headline": "",
    "objective": "",
    "skills": [],
    "experience": [],
    "projects": [],
    "education": []
}}
"""

        # --------------------------------------
        # Send request to Gemini
        # --------------------------------------

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

        # --------------------------------------
        # Read AI response
        # --------------------------------------

        text = response.text.strip()

        # Remove markdown code fences
        if text.startswith("```"):

            text = text.replace(
                "```json",
                ""
            )

            text = text.replace(
                "```",
                ""
            )

            text = text.strip()

        # --------------------------------------
        # Convert AI response to JSON
        # --------------------------------------

        generated_resume = json.loads(
            text
        )

        # --------------------------------------
        # Return result
        # --------------------------------------

        return jsonify({
            "success": True,
            "resume": generated_resume
        })

    # --------------------------------------
    # Invalid JSON from Gemini
    # --------------------------------------

    except json.JSONDecodeError:

        return jsonify({
            "success": False,
            "message": "AI returned an invalid resume format."
        }), 500

    # --------------------------------------
    # Any Gemini/API error
    # --------------------------------------

    except Exception as error:

        print(
            "Gemini Error:",
            error
        )

        return jsonify({
            "success": False,
            "message": "Gemini AI request failed."
        }), 500
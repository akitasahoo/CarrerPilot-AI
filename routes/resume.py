from flask import Blueprint, request, jsonify, session
import json
import os

from google import genai


resume = Blueprint("resume", __name__)


@resume.route("/api/resume/generate", methods=["POST"])
def generate_resume():

    user_id = session.get("user_id")

    if not user_id:
        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    data = request.get_json() or {}

    target_role = data.get("targetRole", "").strip()
    experience_level = data.get(
        "experienceLevel",
        ""
    ).strip()

    profile = data.get("profile", {})

    if not target_role:
        return jsonify({
            "success": False,
            "message": "Target job role is required."
        }), 400

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key or api_key == "your_google_gemini_api_key_here":
        return jsonify({
            "success": False,
            "message": "Gemini API key is not configured."
        }), 500

    try:

        client = genai.Client(
            api_key=api_key
        )

        prompt = f"""
You are an expert resume optimization assistant.

Create an ATS-friendly resume optimization
for the target role:

Target Role:
{target_role}

Experience Level:
{experience_level}

IMPORTANT RULES:

1. Use ONLY information present in the user's profile.
2. Never invent a company.
3. Never invent a university.
4. Never invent a job.
5. Never invent an internship.
6. Never invent a project.
7. Never invent dates.
8. Never invent certifications.
9. Never invent achievements.
10. Do not change the user's name or email.
11. Improve wording, clarity and ATS relevance.
12. If a section is empty, keep it empty.
13. Skills may only come from the user's existing skills.
14. Do not add fake experience to make the resume stronger.

User Profile:
{json.dumps(profile, indent=2)}

Return ONLY valid JSON in this structure:

{{
    "headline": "",
    "objective": "",
    "skills": [],
    "experience": [],
    "projects": [],
    "education": []
}}
"""

        response = client.models.generate_content(
            model="gemini-3.8-flash",
            contents=prompt
        )

        text = response.text.strip()

        # Remove markdown code fences if Gemini adds them
        if text.startswith("```"):
            text = text.replace("```json", "")
            text = text.replace("```", "")
            text = text.strip()

        generated_resume = json.loads(text)

        return jsonify({
            "success": True,
            "resume": generated_resume
        })

    except json.JSONDecodeError:

        return jsonify({
            "success": False,
            "message": "AI returned an invalid resume format."
        }), 500

    except Exception as error:

        print("Gemini Error:", error)

        return jsonify({
            "success": False,
            "message": "Gemini AI request failed."
        }), 500
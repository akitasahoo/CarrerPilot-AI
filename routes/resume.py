
from flask import Blueprint, request, jsonify, session
import json
import os
from pypdf import PdfReader
from io import BytesIO
from docx import Document
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

resume = Blueprint("resume", __name__)


# ==========================================
# AI RESUME GENERATOR - GROQ
# ==========================================
@resume.route("/api/resume/generate", methods=["POST"])
def generate_resume():

    # Check login
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    # Get request data
    data = request.get_json(silent=True) or {}

    target_role = data.get("targetRole", "")
    experience_level = data.get("experienceLevel", "")
    profile = data.get("profile", {})

    # Validate input
    if not isinstance(target_role, str) or not target_role.strip():
        return jsonify({
            "success": False,
            "message": "Target job role is required."
        }), 400

    if not isinstance(profile, dict):
        return jsonify({
            "success": False,
            "message": "Invalid profile data."
        }), 400

    if not isinstance(experience_level, str):
        experience_level = ""

    target_role = target_role.strip()
    experience_level = experience_level.strip()

    # Get Groq API key
    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        return jsonify({
            "success": False,
            "message": "Groq API key is not configured."
        }), 500

    # AI Resume Generation
    try:
        client = Groq(api_key=api_key)

        prompt = f"""
You are an expert ATS resume optimization assistant.

Your task is to improve the user's existing profile for
the specified target job role.

TARGET JOB ROLE:
{target_role}

EXPERIENCE LEVEL:
{experience_level}

USER PROFILE:
{json.dumps(profile, indent=2, ensure_ascii=False)}

IMPORTANT RULES:
1. Use only information present in the user's profile.
2. Never invent companies, universities, jobs or internships.
3. Never invent projects, dates, certifications or achievements.
4. Never invent skills that are absent from the profile.
5. Never change the user's name or email.
6. Never create fake work experience.
7. Improve wording to make existing information professional
   and ATS-friendly.
8. You may reorganize existing skills for relevance.
9. If information is missing, return an empty value.
10. Preserve the actual facts and meaning of every entry.
11. Return only a valid JSON object, without markdown fences.

Use exactly this JSON structure:
{{
    "headline": "",
    "objective": "",
    "skills": [],
    "experience": [],
    "projects": [],
    "education": []
}}
"""

        response = client.chat.completions.create(
           model="openai/gpt-oss-20b",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You optimize resumes using only verified "
                        "user-provided information. Return valid JSON only."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.2,
            response_format={"type": "json_object"}
        )

        # Read Groq response
        response_text = response.choices[0].message.content

        if not response_text:
            raise ValueError("Groq returned an empty response.")

        generated_resume = json.loads(response_text)

        # Validate response structure
        required_keys = [
            "headline",
            "objective",
            "skills",
            "experience",
            "projects",
            "education"
        ]

        if not isinstance(generated_resume, dict):
            raise ValueError("Invalid resume structure.")

        if not all(key in generated_resume for key in required_keys):
            raise ValueError("Required resume fields are missing.")

        # Return result
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
        # Keep technical details in the server terminal only
        print("Groq Resume Error:", type(error).__name__, str(error))

        return jsonify({
            "success": False,
            "message": "Groq AI request failed. Check the server terminal."
        }), 500
    
@resume.route("/api/resume/analyze", methods=["POST"])
def analyze_resume():
    # Check login
    if not session.get("user_id"):
        return jsonify({
            "success": False,
            "message": "Please login first."
        }), 401

    # Accept either a file upload or existing JSON text
    if "resume" in request.files:
        uploaded_file = request.files["resume"]
        filename = (uploaded_file.filename or "").lower()

        if not filename:
            return jsonify({
                "success": False,
                "message": "Please select a resume file."
            }), 400

        # Limit upload size to 5 MB
        file_bytes = uploaded_file.read(5 * 1024 * 1024 + 1)

        if len(file_bytes) > 5 * 1024 * 1024:
            return jsonify({
                "success": False,
                "message": "Resume file must be 5 MB or smaller."
            }), 413

        if not file_bytes:
            return jsonify({
                "success": False,
                "message": "The selected file is empty."
            }), 400

        try:
            if filename.endswith(".pdf"):
                reader = PdfReader(BytesIO(file_bytes))

                if reader.is_encrypted:
                    return jsonify({
                        "success": False,
                        "message": "Please upload an unlocked PDF."
                    }), 400

                text = "\n".join(
                    page.extract_text() or ""
                    for page in reader.pages
                )

            elif filename.endswith(".docx"):
                document = Document(BytesIO(file_bytes))
                text = "\n".join(
                    paragraph.text
                    for paragraph in document.paragraphs
                )

            elif filename.endswith(".txt"):
                text = file_bytes.decode("utf-8-sig")

            else:
                return jsonify({
                    "success": False,
                    "message": "Only PDF, DOCX and TXT files are supported."
                }), 400

        except Exception as error:
            print(
                "Resume Extraction Error:",
                type(error).__name__,
                str(error)
            )
            return jsonify({
                "success": False,
                "message": "Could not read this file. Please check its format."
            }), 400

        target_role = request.form.get(
            "targetJobRole", "Software Engineer"
        )

    else:
        # Preserve support for existing frontend requests
        data = request.get_json(silent=True) or {}
        text = data.get("text", "")
        target_role = data.get(
            "targetJobRole", "Software Engineer"
        )

    # Validate extracted/provided text
    if not isinstance(text, str) or len(text.strip()) < 15:
        return jsonify({
            "success": False,
            "message": (
                "Not enough resume text was found. "
                "A scanned PDF may require OCR."
            )
        }), 400

    if not isinstance(target_role, str) or not target_role.strip():
        return jsonify({
            "success": False,
            "message": "Please enter a target job role."
        }), 400

    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        return jsonify({
            "success": False,
            "message": "Groq API key is not configured."
        }), 500

    prompt = f"""
Analyze this resume for the target job role: {target_role.strip()}

RESUME:
{text[:20000]}

Return only valid JSON with these exact keys:
{{
  "overallScore": 0,
  "formattingScore": 0,
  "keywordScore": 0,
  "grammarScore": 0,
  "impactScore": 0,
  "matchedKeywords": [],
  "missingSkills": [],
  "suggestions": []
}}

Give reasonable scores from 0 to 100 based on the provided text.
Only list missing skills relevant to the target role.
Do not invent candidate qualifications.
Return arrays of strings for matchedKeywords, missingSkills and suggestions.
"""

    try:
        client = Groq(api_key=api_key)

        response = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an ATS resume analyst. "
                        "Return valid JSON only."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.2,
            response_format={"type": "json_object"}
        )

        response_text = response.choices[0].message.content

        if not response_text:
            raise ValueError("Groq returned an empty response.")

        result = json.loads(response_text)

        required_scores = [
            "overallScore",
            "formattingScore",
            "keywordScore",
            "grammarScore",
            "impactScore"
        ]

        required_lists = [
            "matchedKeywords",
            "missingSkills",
            "suggestions"
        ]

        if not isinstance(result, dict):
            raise ValueError("Invalid ATS analysis response.")

        for key in required_scores:
            value = result.get(key)

            if (
                isinstance(value, bool)
                or not isinstance(value, (int, float))
            ):
                raise ValueError(f"Invalid score: {key}")

            result[key] = max(0, min(100, value))

        for key in required_lists:
            value = result.get(key)

            if (
                not isinstance(value, list)
                or not all(isinstance(item, str) for item in value)
            ):
                raise ValueError(f"Invalid list: {key}")

        return jsonify(result)

    except Exception as error:
        print(
            "Groq ATS Analysis Error:",
            type(error).__name__,
            str(error)
        )

        return jsonify({
            "success": False,
            "message": "ATS analysis failed. Check the server terminal."
        }), 500
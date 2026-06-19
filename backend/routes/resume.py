import json
import pdfplumber
from fastapi import APIRouter, UploadFile, File, HTTPException
from openai import OpenAI
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

client = OpenAI()
router = APIRouter()


def extract_pdf_text(file) -> str:
    """Extract raw text from uploaded PDF."""
    try:
        with pdfplumber.open(file) as pdf:
            text = "\n".join(
                page.extract_text() or "" for page in pdf.pages
            )
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read PDF: {str(e)}")


def ai_parse_resume(pdf_text: str) -> dict:
    """
    Send raw resume text to GPT-4o-mini.
    Returns structured data optimized for our DB and sentence transformer.
    """
    prompt = f"""
You are a resume parser. Extract information from the resume below and return ONLY a valid JSON object — no explanation, no markdown, no code fences.

Resume:
{pdf_text}

Return this exact JSON structure:
{{
    "name": "full name or empty string",
    "email": "email address or empty string",
    "github_url": "github profile URL or empty string",
    "portfolio_url": "portfolio or personal website URL or empty string",
    "skills": ["skill1", "skill2", "skill3"],
    "years_experience": 0,
    "availability": "full-time",
    "location": "remote",
    "resume_text": "150-200 word professional summary that captures their technical skills, domain expertise, project experience, and career focus. This summary will be used for semantic job matching so clearly mention all key technical terms, frameworks, tools, and domain areas."
}}

Rules:
- years_experience must be an integer (estimate from graduation year or work history if not stated)
- availability must be one of exactly: full-time, freelance, project-based, Internship
- location must be one of exactly: remote, hybrid, on-site
- skills must be a flat list of strings, max 8 skills
- resume_text must be rich with technical keywords for semantic search — not a generic bio
- If something is not in the resume, use empty string or sensible default
- Return ONLY the JSON object, nothing else
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,   # low temp for consistent structured output
    )

    raw = response.choices[0].message.content.strip()

    # Strip markdown fences if model adds them despite instructions
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail="AI could not parse the resume. Please try again or fill the form manually."
        )


@router.post("/candidates/parse-resume")
async def parse_resume(file: UploadFile = File(...)):
    """
    Accepts a PDF resume upload.
    Returns AI-extracted candidate data to pre-fill the form.
    Candidate reviews and confirms before saving to DB.
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    # Extract text from PDF
    pdf_text = extract_pdf_text(file.file)

    if not pdf_text or len(pdf_text) < 50:
        raise HTTPException(
            status_code=400,
            detail="Could not extract text from this PDF. It may be scanned or image-based."
        )

    # Parse with AI
    parsed = ai_parse_resume(pdf_text)

    return {
        "name":             parsed.get("name", ""),
        "email":            parsed.get("email", ""),
        "github_url":       parsed.get("github_url", ""),
        "portfolio_url":    parsed.get("portfolio_url", ""),
        "skills":           parsed.get("skills", []),
        "years_experience": parsed.get("years_experience", 0),
        "availability":     parsed.get("availability", "full-time"),
        "location":         parsed.get("location", "remote"),
        "resume_text":      parsed.get("resume_text", ""),
    }
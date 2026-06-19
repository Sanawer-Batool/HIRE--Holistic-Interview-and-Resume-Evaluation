import sqlite3
from fastapi import APIRouter, Depends, HTTPException
from backend.database import get_db
from backend.models import CandidateCreate, CandidateUpdate

router = APIRouter()


# ─── GET /candidates ─────────────────────────────────────────
# Returns all candidates
@router.get("/candidates")
def get_all_candidates(db=Depends(get_db)):
    candidates = db.execute("SELECT * FROM candidates").fetchall()
    return [dict(row) for row in candidates]


# ─── GET /candidates/search?skill=Python ─────────────────────
# IMPORTANT: this route must come BEFORE /candidates/{id}
# otherwise FastAPI will treat "search" as an {id}
@router.get("/candidates/search")
def search_by_skill(skill: str, db=Depends(get_db)):
    candidates = db.execute(
        "SELECT * FROM candidates WHERE skills LIKE ?",
        (f"%{skill}%",)
    ).fetchall()

    if not candidates:
        raise HTTPException(status_code=404, detail="No candidates found")

    return [dict(row) for row in candidates]


# ─── POST /candidates/email-status/batch ─────────────────────
# IMPORTANT: must come BEFORE /candidates/{id}
@router.post("/candidates/email-status/batch")
def get_email_status_batch(payload: dict, db=Depends(get_db)):
    ids = payload.get("candidate_ids", [])
    if not ids:
        return {"results": []}

    placeholders = ",".join("?" * len(ids))
    rows = db.execute(
        f"SELECT id, name, email, email_sent, email_response, responded_at FROM candidates WHERE id IN ({placeholders})",
        ids
    ).fetchall()

    results = []
    for row in rows:
        row = dict(row)
        results.append({
            "candidate_id": row["id"],
            "name":         row["name"],
            "email":        row["email"],
            "email_sent":   bool(row["email_sent"]),
            "responded":    row["email_response"] is not None,
            "response":     row["email_response"],
            "responded_at": row["responded_at"]
        })

    return {"results": results}


# ─── GET /candidates/{id}/email-status ───────────────────────
@router.get("/candidates/{id}/email-status")
def get_email_status(id: int, db=Depends(get_db)):
    row = db.execute(
        "SELECT id, name, email, email_sent, email_response, responded_at FROM candidates WHERE id = ?",
        (id,)
    ).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Candidate not found")

    row = dict(row)
    return {
        "candidate_id": row["id"],
        "name":         row["name"],
        "email":        row["email"],
        "email_sent":   bool(row["email_sent"]),
        "responded":    row["email_response"] is not None,
        "response":     row["email_response"],
        "responded_at": row["responded_at"]
    }


# ─── GET /candidates/{id} ─────────────────────────────────────
# Returns a single candidate by ID
@router.get("/candidates/{id}")
def get_candidate(id: int, db=Depends(get_db)):
    candidate = db.execute(
        "SELECT * FROM candidates WHERE id = ?", (id,)
    ).fetchone()

    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    return dict(candidate)


# ─── POST /candidates ─────────────────────────────────────────
# Adds a new candidate
@router.post("/candidates", status_code=201)
def create_candidate(data: CandidateCreate, db=Depends(get_db)):
    skills_str = ', '.join(data.skills)

    cursor = db.execute("""
        INSERT INTO candidates
        (name, email, skills, resume_text, github_url, portfolio_url, availability, location, years_experience, applying_for)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data.name, data.email, skills_str, data.resume_text,
        data.github_url, data.portfolio_url,
        data.availability, data.location, data.years_experience,
        data.applying_for
    ))
    db.commit()

    return {"message": "Candidate added successfully", "id": cursor.lastrowid}


# ─── PUT /candidates/{id} ─────────────────────────────────────
# Updates only the fields you send — ignores the rest
@router.put("/candidates/{id}")
def update_candidate(id: int, data: CandidateUpdate, db=Depends(get_db)):
    # Build query dynamically from only the fields that were actually sent
    fields = {k: v for k, v in data.model_dump().items() if v is not None}

    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    if "skills" in fields:
        fields["skills"] = ', '.join(fields["skills"])

    set_clause = ", ".join(f"{k} = ?" for k in fields)
    values = list(fields.values()) + [id]

    db.execute(f"UPDATE candidates SET {set_clause} WHERE id = ?", values)
    db.commit()

    return {"message": "Candidate updated successfully"}


# ─── DELETE /candidates/{id} ──────────────────────────────────
# Deletes a candidate by ID
@router.delete("/candidates/{id}")
def delete_candidate(id: int, db=Depends(get_db)):
    result = db.execute(
        "DELETE FROM candidates WHERE id = ?", (id,)
    )
    db.commit()

    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Candidate not found")

    return {"message": "Candidate deleted successfully"}
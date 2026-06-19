from fastapi import APIRouter, Depends, HTTPException

from backend.database import get_db
from backend.models import CandidateDisposition, CloseJobRunRequest, CreateJobRunRequest

router = APIRouter()


# ── Create a new job run (called right after ST matching) ─────────────────────
@router.post("/job-runs")
def create_job_run(request: CreateJobRunRequest, db=Depends(get_db)):

    cursor = db.execute(
        """
        INSERT INTO job_runs (job_title, job_description, role_applied, availability, location)
        VALUES (?, ?, ?, ?, ?)
        """,
        (
            request.job_title,
            request.job_description,
            request.role_applied,
            request.availability,
            request.location,
        ),
    )
    db.commit()
    job_run_id = cursor.lastrowid

    if not request.candidate_ids:
        return {"job_run_id": job_run_id, "message": "Job run created"}

    placeholders = ",".join("?" * len(request.candidate_ids))
    rows = db.execute(
        f"SELECT id, name, email FROM candidates WHERE id IN ({placeholders})",
        request.candidate_ids,
    ).fetchall()

    for row in rows:
        row = dict(row)
        ml_score = request.ml_scores.get(str(row["id"]), 0)
        db.execute(
            """
            INSERT INTO job_run_candidates
            (job_run_id, candidate_id, candidate_name, candidate_email, ml_score)
            VALUES (?, ?, ?, ?, ?)
            """,
            (job_run_id, row["id"], row["name"], row["email"], ml_score),
        )

    db.commit()

    return {"job_run_id": job_run_id, "message": "Job run created"}


# ── Get all job runs (for the previous runs list) ─────────────────────────────
@router.get("/job-runs")
def get_all_job_runs(db=Depends(get_db)):
    rows = db.execute(
        """
        SELECT id, job_title, role_applied, created_at, status
        FROM job_runs
        ORDER BY created_at DESC
        """
    ).fetchall()

    return {"job_runs": [dict(row) for row in rows]}


# ── Get a single job run with all candidate results ───────────────────────────
@router.get("/job-runs/{job_run_id}")
def get_job_run(job_run_id: int, db=Depends(get_db)):
    job_run = db.execute(
        "SELECT * FROM job_runs WHERE id = ?",
        (job_run_id,),
    ).fetchone()

    if not job_run:
        raise HTTPException(status_code=404, detail="Job run not found")

    candidates = db.execute(
        """
        SELECT
            jrc.id AS job_run_candidate_id,
            jrc.candidate_id,
            jrc.candidate_name,
            jrc.candidate_email,
            jrc.ml_score,
            jrc.github_report,
            jrc.email_sent,
            jrc.disposition,
            COALESCE(c.email_response, jrc.email_response) AS email_response,
            COALESCE(c.responded_at, jrc.responded_at) AS responded_at,
            jrc.hiring_report
        FROM job_run_candidates jrc
        LEFT JOIN candidates c ON c.id = jrc.candidate_id
        WHERE jrc.job_run_id = ?
        ORDER BY jrc.ml_score DESC
        """,
        (job_run_id,),
    ).fetchall()

    return {
        "job_run": dict(job_run),
        "candidates": [dict(c) for c in candidates],
    }


# ── Delete a job run and its candidate results ───────────────────────────────
@router.delete("/job-runs/{job_run_id}")
def delete_job_run(job_run_id: int, db=Depends(get_db)):
    run = db.execute(
        "SELECT id FROM job_runs WHERE id = ?",
        (job_run_id,),
    ).fetchone()

    if not run:
        raise HTTPException(status_code=404, detail="Job run not found")

    db.execute("DELETE FROM job_run_candidates WHERE job_run_id = ?", (job_run_id,))
    db.execute("DELETE FROM job_runs WHERE id = ?", (job_run_id,))
    db.commit()

    return {"deleted": True}


# ── Update a candidate's agent result in a job run ────────────────────────────
@router.patch("/job-runs/{job_run_id}/candidates/{candidate_id}")
def update_job_run_candidate(job_run_id: int, candidate_id: int, payload: dict, db=Depends(get_db)):
    allowed = {"github_report", "email_sent", "email_response", "responded_at", "hiring_report"}
    fields = {k: v for k, v in payload.items() if k in allowed}

    if not fields:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    set_clause = ", ".join(f"{k} = ?" for k in fields)
    values = list(fields.values()) + [job_run_id, candidate_id]

    db.execute(
        f"UPDATE job_run_candidates SET {set_clause} WHERE job_run_id = ? AND candidate_id = ?",
        values,
    )
    db.commit()

    return {"message": "Updated successfully"}


# ── Save a single disposition (called as recruiter clicks each button) ────────
@router.patch("/job-runs/{job_run_id}/disposition")
def set_disposition(job_run_id: int, payload: CandidateDisposition, db=Depends(get_db)):
    db.execute(
        """
        UPDATE job_run_candidates
        SET disposition = ?
        WHERE job_run_id = ? AND candidate_id = ?
        """,
        (payload.disposition, job_run_id, payload.candidate_id),
    )
    db.commit()

    return {"message": "Disposition saved"}


# ── Close job run — finalizes all dispositions ────────────────────────────────
@router.post("/job-runs/{job_run_id}/close")
def close_job_run(job_run_id: int, request: CloseJobRunRequest, db=Depends(get_db)):
    for item in request.dispositions:
        db.execute(
            """
            UPDATE job_run_candidates
            SET disposition = ?
            WHERE job_run_id = ? AND candidate_id = ?
            """,
            (item.disposition, job_run_id, item.candidate_id),
        )

        if item.disposition == "hired":
            db.execute(
                """
                UPDATE candidates
                SET status = 'hired'
                WHERE id = ?
                """,
                (item.candidate_id,),
            )

    db.execute(
        """
        UPDATE job_runs
        SET status = 'completed'
        WHERE id = ?
        """,
        (job_run_id,),
    )

    db.commit()

    return {
        "message": "Job run closed successfully",
        "hired_count": sum(1 for d in request.dispositions if d.disposition == "hired"),
    }


# ── Reactivate a candidate if hired by mistake ────────────────────────────────
@router.patch("/candidates/{id}/reactivate")
def reactivate_candidate(id: int, db=Depends(get_db)):
    db.execute(
        "UPDATE candidates SET status = 'active' WHERE id = ?",
        (id,),
    )
    db.commit()
    return {"message": "Candidate reactivated"}


# ── Mark job run as completed ─────────────────────────────────────────────────
@router.patch("/job-runs/{job_run_id}/complete")
def complete_job_run(job_run_id: int, db=Depends(get_db)):
    db.execute("UPDATE job_runs SET status = 'completed' WHERE id = ?", (job_run_id,))
    db.commit()
    return {"message": "Job run marked as completed"}
from fastapi import APIRouter, Depends
from backend.database import get_db
from backend.services.agent_service import run_agent_suite
from backend.services.email_service import run_email_agent
from backend.services.scorecard_service import run_scorecard_agent
from backend.models import AgentRunRequest, EmailAgentRequest, ScorecardRequest

router = APIRouter()


@router.post("/agents/run")
def run_agents(request: AgentRunRequest, db=Depends(get_db)):

    if not request.candidate_ids:
        return {"error": "No candidate IDs provided", "results": []}

    # Fetch only id, name, github_url — nothing else needed
    placeholders = ",".join("?" * len(request.candidate_ids))
    rows = db.execute(
        f"SELECT id, name, github_url FROM candidates WHERE id IN ({placeholders})",
        request.candidate_ids
    ).fetchall()

    if not rows:
        return {"error": "No candidates found", "results": []}

    candidates = [dict(row) for row in rows]

    results = run_agent_suite(
        candidates=candidates,
        job_description=request.job_description,
        role_applied=request.role_applied,
        job_run_id=request.job_run_id
    )

    return {"total": len(results), "results": results}


@router.post("/agents/email")
def run_email_agents(request: EmailAgentRequest, db=Depends(get_db)):

    if not request.candidate_ids:
        return {"error": "No candidate IDs provided", "results": []}

    # Fetch id, name, email for each candidate
    placeholders = ",".join("?" * len(request.candidate_ids))
    rows = db.execute(
        f"SELECT id, name, email FROM candidates WHERE id IN ({placeholders})",
        request.candidate_ids
    ).fetchall()

    if not rows:
        return {"error": "No candidates found", "results": []}

    candidates = [dict(row) for row in rows]

    results = run_email_agent(
        candidates=candidates,
        job_description=request.job_description,
        role_applied=request.role_applied,
        job_run_id=request.job_run_id
    )

    return {"total": len(results), "results": results}


@router.post("/agents/scorecard")
def run_scorecard(request: ScorecardRequest, db=Depends(get_db)):

    if not request.candidate_ids:
        return {"error": "No candidate IDs provided", "results": []}

    placeholders = ",".join("?" * len(request.candidate_ids))
    rows = db.execute(
        f"""SELECT id, name, email, match_score, github_report
            FROM candidates
            WHERE id IN ({placeholders})""",
        request.candidate_ids
    ).fetchall()

    if not rows:
        return {"error": "No candidates found", "results": []}

    candidates = [dict(row) for row in rows]

    results = run_scorecard_agent(
        candidates=candidates,
        job_description=request.job_description,
        role_applied=request.role_applied,
        job_run_id=request.job_run_id
    )

    return {"total": len(results), "results": results}
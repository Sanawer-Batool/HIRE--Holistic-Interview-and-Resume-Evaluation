from fastapi import APIRouter, Depends
from backend.database import get_db
from backend.models import MatchRequest
from backend.services.matching_service import match_candidates

router = APIRouter()


@router.post("/match")
def match_with_jd(request: MatchRequest, db=Depends(get_db)):

    # Step 1 — build query, apply filters if provided
    query = "SELECT * FROM candidates WHERE 1=1"
    params = []

    # if recruiter selected availability, filter by it
    if request.availability:
        query += " AND LOWER(availability) = LOWER(?)"
        params.append(request.availability)

    # if recruiter selected location, filter by it
    if request.location:
        query += " AND LOWER(location) = LOWER(?)"
        params.append(request.location)

    # Step 2 — fetch filtered candidates from DB
    rows = db.execute(query, params).fetchall()

    if not rows:
        return {"message": "No candidates found with these filters", "results": []}

    # Step 3 — convert rows to list of dicts
    candidates = [dict(row) for row in rows]

    # Step 4 — run matching, get ranked results
    results = match_candidates(
        job_description=request.job_description,
        candidates=candidates,
        top_n=request.top_n
    )

    return {"total": len(results), "results": results}
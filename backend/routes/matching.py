from fastapi import APIRouter, Depends
from backend.database import get_db
from backend.models import MatchRequest
from backend.services.matching_service import match_candidates

router = APIRouter()


@router.post("/match")
def match_with_jd(request: MatchRequest, db=Depends(get_db)):

    # Step 1 — build query, apply filters if provided
    query = "SELECT * FROM candidates WHERE 1=1 AND status = 'active'"
    params = []

    exp_ranges = {
        "fresh": (0, 1),
        "1-2": (1, 2),
        "2-4": (2, 4),
        "4-6": (4, 6),
        "6-10": (6, 10),
        "10+": (10, None),
    }

    # if recruiter selected availability, filter by it
    if request.availability:
        query += " AND LOWER(availability) = LOWER(?)"
        params.append(request.availability)

    # if recruiter selected location, filter by it
    if request.location:
        query += " AND LOWER(location) = LOWER(?)"
        params.append(request.location)

    # if recruiter selected experience, filter candidates by range
    if request.experience in exp_ranges:
        min_exp, max_exp = exp_ranges[request.experience]
        query += " AND years_experience >= ?"
        params.append(min_exp)
        if max_exp is not None:
            query += " AND years_experience <= ?"
            params.append(max_exp)

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

    for candidate in results:
        db.execute(
            "UPDATE candidates SET match_score = ? WHERE id = ?",
            (candidate["match_score"], candidate["id"])
        )

    db.commit()

    return {"total": len(results), "results": results}
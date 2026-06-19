import json
import re
import sqlite3

from backend.agents.scorecard.crew import ScorecardAgentCrew
from backend.database import DB_PATH


def parse_scorecard_output(raw: str) -> dict:
    """
    Parse the agent's JSON output into a dict.
    Falls back to returning the raw text if parsing fails.
    """
    text = raw.strip()

    # Strip markdown fences if the model wraps JSON in a labeled block
    fenced_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if fenced_match:
        text = fenced_match.group(1).strip()

    text = text.strip()

    try:
        return {"parsed": True, "data": json.loads(text)}
    except json.JSONDecodeError:
        # Fallback — return raw text so frontend can still show something
        return {"parsed": False, "data": raw}


def run_scorecard_agent(candidates: list, job_description: str, role_applied: str, job_run_id=None) -> list:
    """
    Runs the scorecard agent for each candidate.

    Each candidate dict must have:
        id, name, email, match_score, github_report

    match_score  → from Sentence Transformer (already in candidate dict)
    github_report → saved to DB after GitHub agent ran (Step 1 we did earlier)
    """
    results = []
    conn = sqlite3.connect(DB_PATH)

    try:
        for candidate in candidates:
            name         = candidate.get("name", "Unknown")
            email        = candidate.get("email", "")
            candidate_id = candidate.get("id")

            # Convert ST score from decimal to percentage string
            # match_score is stored as e.g. 0.7342 → "73"
            raw_score    = candidate.get("match_score", 0)
            ml_score_pct = str(round(float(raw_score) * 100))

            # GitHub report saved by Agent 1 — may be None if agent hasn't run
            github_report = candidate.get("github_report")

            if not github_report:
                github_summary = (
                    "No GitHub report available for this candidate. "
                    "Either no GitHub URL was provided or the GitHub agent "
                    "has not been run yet. Do not penalize — assess based "
                    "on ML match score and resume signals only."
                )
            else:
                github_summary = github_report

            print(f"\n>>> Running scorecard for: {name} (ML Score: {ml_score_pct}%)")

            try:
                crew   = ScorecardAgentCrew()
                raw = crew.run_for_candidate(
                    candidate_name=name,
                    candidate_email=email,
                    role_applied=role_applied,
                    job_description=job_description,
                    ml_match_score=ml_score_pct,
                    github_summary=github_summary,
                )

                parsed = parse_scorecard_output(str(raw))

                if job_run_id:
                    report_to_save = json.dumps(parsed["data"]) if parsed["parsed"] else str(raw)
                    conn.execute(
                        """
                        UPDATE job_run_candidates
                        SET hiring_report = ?
                        WHERE job_run_id = ? AND candidate_id = ?
                        """,
                        (report_to_save, job_run_id, candidate_id),
                    )
                    conn.commit()

                results.append({
                    "candidate_id": candidate_id,
                    "name":         name,
                    "ml_score":     ml_score_pct,
                    "parsed":       parsed["parsed"],
                    "report":       parsed["data"],
                    "error":        None
                })

            except Exception as e:
                results.append({
                    "candidate_id": candidate_id,
                    "name":         name,
                    "ml_score":     ml_score_pct,
                    "parsed":       False,
                    "report":       None,
                    "error":        str(e)
                })
    finally:
        conn.close()

    return results
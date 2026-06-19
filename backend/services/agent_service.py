import json
import re
import sqlite3

from backend.agents.github.crew import GithubCrawlerCrew
from backend.database import get_db


def parse_github_output(raw: str) -> dict:
    text = raw.strip()

    fenced_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if fenced_match:
        text = fenced_match.group(1).strip()

    text = text.strip()

    try:
        return {"parsed": True, "data": json.loads(text)}
    except json.JSONDecodeError:
        return {"parsed": False, "data": raw}


def run_agent_suite(candidates: list, job_description: str, role_applied: str, job_run_id=None) -> list:
    """
    Runs GitHub crawler + fit evaluator for each candidate one by one.
    Skips candidates with no GitHub URL gracefully.
    """
    results = []
    db_gen = get_db()
    db = next(db_gen)

    try:
        for candidate in candidates:
            github_url   = candidate.get("github_url", "").strip()
            name         = candidate.get("name", "Unknown")
            candidate_id = candidate.get("id")

            if not github_url:
                results.append({
                    "candidate_id": candidate_id,
                    "name": name,
                    "github_url": None,
                    "github_username": None,
                    "parsed": False,
                    "report": None,
                    "error": "No GitHub URL provided for this candidate",
                })
                continue

            github_username = github_url.rstrip("/").split("/")[-1]
            print(f"\n>>> Running agents for: {name} (@{github_username})")

            try:
                crew = GithubCrawlerCrew()
                raw = crew.run_for_candidate(
                    github_username=github_username,
                    role_applied=role_applied,
                    job_description=job_description,
                )

                parsed = parse_github_output(str(raw))

                report_to_save = json.dumps(parsed["data"]) if parsed["parsed"] else str(raw)

                db.execute(
                    "UPDATE candidates SET github_report = ? WHERE id = ?",
                    (report_to_save, candidate_id),
                )

                if job_run_id:
                    db.execute(
                        """
                        UPDATE job_run_candidates
                        SET github_report = ?
                        WHERE job_run_id = ? AND candidate_id = ?
                        """,
                        (report_to_save, job_run_id, candidate_id),
                    )

                db.commit()
                print(f"    github_report saved for id={candidate_id}")

                results.append({
                    "candidate_id": candidate_id,
                    "name": name,
                    "github_url": github_url,
                    "github_username": github_username,
                    "parsed": parsed["parsed"],
                    "report": parsed["data"],
                    "error": None,
                })

            except Exception as e:
                results.append({
                    "candidate_id": candidate_id,
                    "name": name,
                    "github_url": github_url,
                    "github_username": github_username,
                    "parsed": False,
                    "report": None,
                    "error": str(e),
                })
    finally:
        try:
            db_gen.close()
        except:
            pass

    return results

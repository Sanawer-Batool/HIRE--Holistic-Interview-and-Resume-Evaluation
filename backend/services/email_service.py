import sqlite3

from backend.agents.email.crew import HrEmailAgentCrew
from backend.database import DB_PATH


def _email_failed(output: str) -> bool:
    text = str(output).lower()
    return (
        "failed to send email" in text
        or "❌" in text
        or "error" in text
    )


def _mark_email_sent(conn: sqlite3.Connection, candidate_id: int) -> bool:
    cur = conn.execute(
        """
        UPDATE candidates
        SET email_sent = 1,
            email_response = NULL,
            responded_at = NULL
        WHERE id = ?
        """,
        (candidate_id,),
    )
    conn.commit()
    return cur.rowcount > 0


def _mark_job_run_email_sent(conn: sqlite3.Connection, candidate_id: int, job_run_id=None) -> bool:
    if not job_run_id:
        return False

    cur = conn.execute(
        """
        UPDATE job_run_candidates
        SET email_sent = 1
        WHERE job_run_id = ? AND candidate_id = ?
        """,
        (job_run_id, candidate_id),
    )
    conn.commit()
    return cur.rowcount > 0


def run_email_agent(candidates: list, job_description: str, role_applied: str, job_run_id=None) -> list:
    results = []
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    role_for_email = (role_applied or "").strip()

    try:
        for candidate in candidates:
            name         = candidate.get("name", "Candidate")
            email        = candidate.get("email", "").strip()
            candidate_id = candidate.get("id")

            if not email:
                results.append({
                    "candidate_id": candidate_id,
                    "name": name,
                    "email": None,
                    "status": "skipped",
                    "message": "No email address found",
                })
                continue

            print(f"\n>>> Sending HR email to: {name} ({email})")

            try:
                crew   = HrEmailAgentCrew()
                output = crew.run_for_candidate(
                    candidate_id=candidate_id,
                    candidate_name=name,
                    candidate_email=email,
                    role_applied=role_for_email,
                    job_description=job_description,
                )
                output_str = str(output)

                if _email_failed(output_str):
                    results.append({
                        "candidate_id": candidate_id,
                        "name": name,
                        "email": email,
                        "status": "failed",
                        "message": (
                            "Email agent reported a failure. "
                            f"Agent output: {output_str[:500]}"
                        ),
                    })
                else:
                    marked = _mark_email_sent(conn, candidate_id)
                    _mark_job_run_email_sent(conn, candidate_id, job_run_id)
                    print(f"    email_sent=1 for id={candidate_id} (updated={marked})")
                    results.append({
                        "candidate_id": candidate_id,
                        "name": name,
                        "email": email,
                        "status": "sent",
                        "message": output_str,
                    })

            except Exception as e:
                results.append({
                    "candidate_id": candidate_id,
                    "name": name,
                    "email": email,
                    "status": "failed",
                    "message": str(e),
                })
    finally:
        conn.close()

    return results

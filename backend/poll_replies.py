"""
poll_replies.py — run this separately in its own terminal.
Checks Gmail inbox every 60 seconds for replies from candidates.
Saves replies to the database. No LLM involved, no API cost.

Usage:
    python -m backend.poll_replies
"""

import time
import imaplib
import email as email_lib
import sqlite3
import os
from pathlib import Path
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

GMAIL_ADDRESS  = os.environ.get("GMAIL_ADDRESS", "")
GMAIL_APP_PASS = os.environ.get("GMAIL_APP_PASS", "")
DB_PATH        = Path(__file__).resolve().parents[1] / "candidates.db"
POLL_INTERVAL  = 60   # seconds between checks


def get_candidate_emails() -> list[dict]:
    """Fetch all candidates who were emailed but haven't responded yet."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute("""
        SELECT id, name, email
        FROM candidates
        WHERE email_sent = 1
        AND email_response IS NULL
    """).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def save_response(candidate_id: int, reply_text: str):
    """Save candidate reply to the database."""
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        UPDATE candidates
        SET email_response = ?, responded_at = ?
        WHERE id = ?
    """, (reply_text, datetime.now(timezone.utc).isoformat(), candidate_id))
    conn.commit()
    conn.close()
    print(f"✅ Saved reply for candidate ID {candidate_id}")


def check_inbox_for_replies(candidates: list[dict]):
    """Connect to Gmail via IMAP and look for replies from candidates."""
    if not candidates:
        print("No pending candidates to check.")
        print("  Tip: send emails from /search first — poll_replies watches rows where")
        print("       email_sent = 1 and email_response IS NULL.")
        return

    try:
        mail = imaplib.IMAP4_SSL("imap.gmail.com")
        mail.login(GMAIL_ADDRESS, GMAIL_APP_PASS)
        mail.select("inbox")

        for candidate in candidates:
            candidate_email = candidate["email"]
            candidate_id    = candidate["id"]
            name            = candidate["name"]
            subject_ref     = f"Ref#{candidate_id}"

            # Search for the candidate's specific demo thread
            status, messages = mail.search(
                None, f'(UNSEEN FROM "{candidate_email}" SUBJECT "{subject_ref}")'
            )

            if status != "OK" or not messages[0]:
                print(f"⏳ No reply yet from {name} ({candidate_email})")
                continue

            # Get the latest reply
            mail_ids  = messages[0].split()
            latest_id = mail_ids[-1]

            status, msg_data = mail.fetch(latest_id, "(RFC822)")
            raw_email = msg_data[0][1]
            msg       = email_lib.message_from_bytes(raw_email)

            # Extract plain text
            reply_text = ""
            if msg.is_multipart():
                for part in msg.walk():
                    if part.get_content_type() == "text/plain":
                        reply_text = part.get_payload(
                            decode=True
                        ).decode("utf-8", errors="ignore")
                        break
            else:
                reply_text = msg.get_payload(
                    decode=True
                ).decode("utf-8", errors="ignore")

            # Mark as read
            mail.store(latest_id, "+FLAGS", "\\Seen")

            print(f"✅ Reply received from {name}!")
            save_response(candidate_id, reply_text.strip())

        mail.logout()

    except Exception as e:
        print(f"❌ IMAP error: {str(e)}")


def run():
    print("=" * 50)
    print("  Reply Poller — Started")
    print(f"  Checking every {POLL_INTERVAL} seconds")
    print(f"  Gmail: {GMAIL_ADDRESS}")
    print("=" * 50)

    while True:
        print(f"\n[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] Checking for replies...")
        candidates = get_candidate_emails()
        print(f"  Watching {len(candidates)} candidate(s) for replies")
        if candidates:
            for c in candidates:
                print(f"    • {c['name']} <{c['email']}>")
        check_inbox_for_replies(candidates)
        time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    run()
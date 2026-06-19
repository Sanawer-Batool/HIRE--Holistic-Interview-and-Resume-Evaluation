import imaplib
import smtplib
import email
import time
import os
import re
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from crewai.tools import tool

# ── pulled from .env via os.environ ──────────────────────────────────────────
GMAIL_ADDRESS  = os.environ.get("GMAIL_ADDRESS", "")
GMAIL_APP_PASS = os.environ.get("GMAIL_APP_PASS", "")

POLL_INTERVAL_SECONDS = 10   # check inbox every 10s (good for live demo)
POLL_TIMEOUT_SECONDS  = 300  # give up after 5 minutes


def _infer_name_from_email(candidate_email: str) -> str:
    local_part = candidate_email.split("@", 1)[0]
    cleaned = re.sub(r"[._-]+", " ", local_part)
    cleaned = re.sub(r"\d+", "", cleaned).strip()
    return cleaned.title() if cleaned else "Candidate"


def _strip_duplicate_wrappers(content: str) -> str:
    text = content.strip()

    # Remove the tool's old intro block if the model echoed it back.
    text = re.sub(
        r"^\s*Hi there,\s*We came across your profile and would love to know more about you\.\s*"
        r"Please reply to this email with your answers to the following questions:\s*",
        "",
        text,
        flags=re.IGNORECASE | re.DOTALL,
    )

    # Remove common duplicated sign-off/footer blocks from model output.
    footer_patterns = [
        r"\s*Looking forward to your response!?\s*\n\s*Best regards,?\s*\n\s*\[Your Name\]\s*\n\s*\[Your Position\]\s*\n\s*\[Your Company\]\s*$",
        r"\s*We look forward to hearing from you!?\s*\n\s*Best regards,?\s*\n\s*HR Team\s*$",
        r"\s*Best regards,?\s*\n\s*\[Your Name\]\s*\n\s*\[Your Position\]\s*\n\s*\[Your Company\]\s*$",
        r"\s*Best regards,?\s*\n\s*HR Team\s*$",
    ]
    for pattern in footer_patterns:
        text = re.sub(pattern, "", text, flags=re.IGNORECASE)

    return text.strip()


@tool("send_hr_email")
def send_hr_email(
    candidate_name: str,
    candidate_email: str,
    questions: str,
    subject_ref: str = "",
) -> str:
    """
    Sends an HR screening question email to the candidate.

    Args:
        candidate_name: The candidate's actual name.
        candidate_email: The email address of the candidate.
        questions: The full list of HR questions to send as the email body.

    Returns:
        A confirmation string indicating success or failure.
    """
    try:
        msg = MIMEMultipart()
        msg["From"]    = GMAIL_ADDRESS
        msg["To"]      = candidate_email
        msg["Subject"] = (
            f"Quick HR Questions – Hiring Platform – {subject_ref}"
            if subject_ref
            else "Quick HR Questions – Hiring Platform"
        )

        cleaned_questions = _strip_duplicate_wrappers(questions)
        display_name = (candidate_name or "").strip() or _infer_name_from_email(candidate_email)

        body = f"""Dear {display_name},

    Please reply to this email with your answers to the following questions:

    {cleaned_questions}

    Best regards,

    HR Team,
    DforDataSolutions
    """
        msg.attach(MIMEText(body, "plain"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL_ADDRESS, GMAIL_APP_PASS)
            server.sendmail(GMAIL_ADDRESS, candidate_email, msg.as_string())

        return f"✅ Email successfully sent to {candidate_email}."

    except Exception as e:
        return f"❌ Failed to send email: {str(e)}"


@tool("wait_for_reply")
def wait_for_reply(candidate_email: str, subject_ref: str = "") -> str:
    """
    Polls the Gmail inbox via IMAP and waits for a reply from the candidate.

    Args:
        candidate_email: The email address to watch for a reply from.

    Returns:
        The candidate's reply text, or a timeout message if no reply arrives.
    """
    try:
        elapsed = 0
        print(f"\n⏳ Watching inbox for reply from {candidate_email}...")
        print(f"   (checking every {POLL_INTERVAL_SECONDS}s, timeout: {POLL_TIMEOUT_SECONDS}s)\n")

        while elapsed < POLL_TIMEOUT_SECONDS:
            mail = imaplib.IMAP4_SSL("imap.gmail.com")
            mail.login(GMAIL_ADDRESS, GMAIL_APP_PASS)
            mail.select("inbox")

            # Search for unseen emails from the candidate and the matching demo ref
            if subject_ref:
                status, messages = mail.search(
                    None,
                    f'(UNSEEN FROM "{candidate_email}" SUBJECT "{subject_ref}")'
                )
            else:
                status, messages = mail.search(None, f'(UNSEEN FROM "{candidate_email}")')

            if status == "OK" and messages[0]:
                mail_ids = messages[0].split()
                latest_id = mail_ids[-1]

                status, msg_data = mail.fetch(latest_id, "(RFC822)")
                raw_email = msg_data[0][1]
                msg = email.message_from_bytes(raw_email)

                # Extract plain text body
                reply_text = ""
                if msg.is_multipart():
                    for part in msg.walk():
                        if part.get_content_type() == "text/plain":
                            reply_text = part.get_payload(decode=True).decode("utf-8", errors="ignore")
                            break
                else:
                    reply_text = msg.get_payload(decode=True).decode("utf-8", errors="ignore")

                # Mark as read so we don't pick it up again
                mail.store(latest_id, "+FLAGS", "\\Seen")
                mail.logout()

                print(f"✅ Reply received from {candidate_email}!")
                return f"Candidate reply:\n\n{reply_text.strip()}"

            mail.logout()
            print(f"   No reply yet... {elapsed}s elapsed")
            time.sleep(POLL_INTERVAL_SECONDS)
            elapsed += POLL_INTERVAL_SECONDS

        return (
            f"⏰ Timeout: No reply from {candidate_email} "
            f"within {POLL_TIMEOUT_SECONDS} seconds."
        )

    except Exception as e:
        return f"❌ Error while polling inbox: {str(e)}"
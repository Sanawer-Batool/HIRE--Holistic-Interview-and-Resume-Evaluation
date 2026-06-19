import sqlite3
import json
import os


def connect_db():
    return sqlite3.connect("candidates.db")


def ensure_column(cursor, table_name, column_name, column_definition):
    existing_columns = {
        row[1] for row in cursor.execute(f"PRAGMA table_info({table_name})")
    }

    if column_name not in existing_columns:
        cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_definition}")


def create_table():
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS candidates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT,
        skills TEXT,
        resume_text TEXT,
        github_url TEXT,
        portfolio_url TEXT,
        availability TEXT,
        years_experience INTEGER,
        location TEXT,
        applying_for TEXT DEFAULT NULL,
        match_score REAL DEFAULT NULL,
        github_report TEXT DEFAULT NULL,
        email_sent INTEGER DEFAULT 0,
        email_response TEXT DEFAULT NULL,
        responded_at TEXT DEFAULT NULL,
        status TEXT DEFAULT 'active'
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS job_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_title TEXT,
        job_description TEXT,
        role_applied TEXT,
        availability TEXT,
        location TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        status TEXT DEFAULT 'in_progress'
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS job_run_candidates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_run_id INTEGER,
        candidate_id INTEGER,
        candidate_name TEXT,
        candidate_email TEXT,
        ml_score REAL,
        github_report TEXT,
        email_sent INTEGER DEFAULT 0,
        email_response TEXT,
        responded_at TEXT,
        hiring_report TEXT,
        disposition TEXT DEFAULT NULL,
        FOREIGN KEY (job_run_id) REFERENCES job_runs(id)
    )
    """)

    ensure_column(cursor, "candidates", "status", "status TEXT DEFAULT 'active'")
    ensure_column(cursor, "job_run_candidates", "disposition", "disposition TEXT DEFAULT NULL")

    conn.commit()
    conn.close()
    print("Tables ready!")


def auto_insert_json():
    conn = connect_db()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM candidates")
    count = cursor.fetchone()[0]

    if count == 0:
        if os.path.exists("candidates.json"):
            with open("candidates.json", "r") as file:
                data = json.load(file)

            for c in data:
                skills_str = ', '.join(c["skills"]) if isinstance(c["skills"], list) else c["skills"]
                cursor.execute("""
                INSERT INTO candidates
                (name, email, skills, resume_text, github_url, portfolio_url, availability, years_experience, location, applying_for)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    c["name"], c["email"], skills_str, c["resume_text"],
                    c["github_url"], c["portfolio_url"],
                    c["availability"], c["years_experience"], c["location"], c.get("applying_for")
                ))

            conn.commit()
            print("JSON data inserted successfully!")
        else:
            print("candidates.json not found!")

    conn.close()


if __name__ == "__main__":
    create_table()
    auto_insert_json()
'''
the key addition is `if __name__ == "__main__"` at the bottom. This means:
- When you **run it directly** (`python candidates_db.py`) → it creates the table and seeds data, useful for first-time setup
- When your **app imports it** (`from candidates_db import connect_db`) → it does nothing automatically, no side effects

Then in your app (e.g. `app.py`) your structure would look like:
HIRE-Project/
│
├── candidates_db.py              # DB setup & seeding
├── candidates.json
├── candidates.db
│
├── app.py                        # FastAPI entry point
│
├── routes/
│   ├── candidates.py             # CRUD endpoints
│   └── matching.py               # Resume matching endpoints
│
├── services/
│   ├── candidate_service.py      # DB queries
│   ├── matching_service.py       # Sentence Transformer logic
│   └── agent_service.py          # CrewAI agent logic
│
└── models/
    └── schemas.py                # Pydantic request/response models

'''


import sqlite3
import json
import os


def connect_db():
    return sqlite3.connect("candidates.db")


def create_table():
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("DROP TABLE IF EXISTS candidates")
    cursor.execute("""
    CREATE TABLE candidates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT,
        skills TEXT,
        resume_text TEXT,
        github_url TEXT,
        portfolio_url TEXT,
        availability TEXT,
        years_experience INTEGER,
        location TEXT
    )
    """)
    conn.commit()
    conn.close()
    print("Table is ready!")


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
                (name, email, skills, resume_text, github_url, portfolio_url, availability, years_experience, location)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    c["name"], c["email"], skills_str, c["resume_text"],
                    c["github_url"], c["portfolio_url"],
                    c["availability"], c["years_experience"], c["location"]
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


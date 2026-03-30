import sqlite3

conn = sqlite3.connect("candidates.db")
cursor = conn.cursor()

# Fetch ALL candidates
cursor.execute("SELECT * FROM candidates")
all_candidates = cursor.fetchall()

print(f"Total candidates in database: {len(all_candidates)}")
print("-" * 60)

# Print each one nicely
for candidate in all_candidates:
    id, name, email, skills, resume_text, github_url, portfolio_url, availability, years_exp, loc = candidate
    print(f"ID:           {id}")
    print(f"Name:         {name}")
    print(f"Email:        {email}")
    print(f"Skills:       {skills}")
    print(f"Resume:       {resume_text[:80]}...")
    print(f"GitHub:       {github_url}")
    print(f"Portfolio:    {portfolio_url}")
    print(f"Availability: {availability}")
    print(f"Experience:   {years_exp} years")
    print(f"Location:     {loc}")
    print("-" * 60)

conn.close()
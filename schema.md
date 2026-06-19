# Database Schema

## Candidates Table

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-incremented unique ID (1, 2, 3...) |
| name | TEXT | Full name |
| email | TEXT | Email address |
| skills | TEXT | Comma-separated: "Python, React, SQL" |
| resume_text | TEXT | The full resume as a big block of text |
| github_url | TEXT | e.g. github.com/johndoe |
| portfolio_url | TEXT | Personal site or Behance etc. |
| availability | TEXT | One of: "full-time", "part-time", "remote", "freelance", "contract" |
| years_experience | INTEGER | Number like 2, 5, 8 |
| match_score | REAL | Persisted match score used by the scorecard agent |
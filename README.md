# HIRE — AI-Powered Recruitment Intelligence Platform

HIRE is a full-stack recruitment platform that combines semantic candidate matching with an autonomous AI agent suite to help recruiters find, verify, contact, and evaluate technical talent — all in one pipeline.

Instead of keyword-based resume filtering, HIRE uses Sentence Transformers to semantically rank candidates against a job description, then deploys three CrewAI agents to independently verify technical claims via GitHub, send personalized screening emails, and generate a final, explainable hiring scorecard.

---

## Features

- **AI Resume Parsing** — candidates upload a PDF resume; AI extracts structured data and generates a semantically rich profile summary
- **Semantic Candidate Matching** — Sentence Transformers rank candidates by meaning, not keywords, with hard filters for availability, location, and experience
- **GitHub Verification Agent** — crawls a candidate's recent repositories and cross-references resume claims against real technical evidence
- **HR Email Agent** — composes and sends personalized screening questions; replies are detected via a lightweight background poller
- **Scorecard Agent** — synthesizes match score and GitHub evidence into a weighted, visual hiring recommendation
- **Job Run History** — every search is saved with full agent results, retrievable anytime
- **Candidate Disposition** — mark candidates as Hired / Consider Later / Not a Fit; hired candidates are automatically excluded from future searches

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, Tailwind CSS |
| Backend | FastAPI, Pydantic |
| Database | SQLite |
| ML Matching | Sentence Transformers (`all-MiniLM-L6-v2`) |
| Similarity Metric | Cosine Similarity (scikit-learn) |
| AI Agent Framework | CrewAI |
| LLM | GPT-4o-mini (OpenAI) |
| External APIs | GitHub REST API, Gmail SMTP/IMAP |
| Resume Parsing | pdfplumber |

---

## Architecture

```
Candidate Registration (PDF Resume Upload)
            ↓
        SQLite Database
            ↓
        FastAPI Backend
            ↓
  Sentence Transformer Matching Engine
            ↓
      CrewAI Agent Suite
   ┌──────────┼──────────┐
GitHub      HR Email   Scorecard
Crawler      Agent       Agent
   └──────────┴──────────┘
            ↓
     Next.js Frontend Dashboard
```

---

## Project Structure

```
HIRE-Project/
├── .env                       # API keys (not committed)
├── candidates.db              # SQLite database
├── candidates.json            # Seed data
├── candidates_db.py           # DB table creation + seeding script
│
├── backend/
│   ├── main.py                 # FastAPI entry point
│   ├── database.py             # DB connection handling
│   ├── models.py                # Pydantic request/response schemas
│   ├── poll_replies.py          # Standalone IMAP reply poller (no LLM cost)
│   │
│   ├── routes/
│   │   ├── candidates.py        # Candidate CRUD endpoints
│   │   ├── matching.py          # Semantic matching endpoint
│   │   ├── agents.py            # Agent trigger endpoints
│   │   ├── job_runs.py          # Job run history + disposition
│   │   └── resume.py            # PDF resume parsing endpoint
│   │
│   ├── services/
│   │   ├── matching_service.py  # Sentence Transformer logic
│   │   ├── agent_service.py     # GitHub agent orchestration
│   │   ├── email_service.py     # Email agent orchestration
│   │   └── scorecard_service.py # Scorecard agent orchestration
│   │
│   └── agents/
│       ├── github/              # GitHub Crawler Agent (CrewAI)
│       ├── email/               # HR Email Agent (CrewAI)
│       └── scorecard/           # Scorecard Agent (CrewAI)
│
└── frontend/
    ├── app/                     # Next.js App Router pages
    ├── components/              # Reusable UI components
    └── lib/api.js                # Backend API client functions
```

---

## Getting Started

### Prerequisites

- Python 3.10 – 3.13
- Node.js 18+
- Gmail account with an [App Password](https://myaccount.google.com/apppasswords) enabled
- API keys: [OpenAI](https://platform.openai.com/), [GitHub Personal Access Token](https://github.com/settings/tokens)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/HIRE-Project.git
cd HIRE-Project
```

### 2. Backend setup

```bash
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install fastapi uvicorn pydantic python-dotenv requests sentence-transformers scikit-learn numpy openai crewai[litellm] crewai-tools pdfplumber
```

### 3. Environment variables

Create a `.env` file in the project root:

```env
OPENAI_API_KEY=your_openai_api_key
MODEL=openai/gpt-4o-mini
GITHUB_TOKEN=your_github_personal_access_token
GMAIL_ADDRESS=your_gmail_address@gmail.com
GMAIL_APP_PASS=your_16_character_app_password
```

### 4. Initialize the database

```bash
python candidates_db.py
```

### 5. Frontend setup

```bash
cd frontend
npm install
```

### 6. Run the application

Run each of these in a **separate terminal**:

```bash
# Terminal 1 — Backend
uvicorn backend.main:app --reload

# Terminal 2 — Frontend
cd frontend
npm run dev

# Terminal 3 — Reply Poller
python -m backend.poll_replies
```

- Frontend: `http://localhost:3000`
- Backend API docs: `http://localhost:8000/docs`

---

## How Matching Works

1. Recruiter submits a job description with optional filters (availability, location, experience)
2. SQL filters narrow the candidate pool to those meeting hard requirements
3. The job description and each candidate's resume summary are encoded into 384-dimensional vectors using `all-MiniLM-L6-v2`
4. Cosine similarity ranks candidates by semantic relevance — not keyword overlap
5. Top candidates proceed to the AI agent suite for deeper evaluation

---

## The AI Agent Suite

| Agent | Role |
|---|---|
| **GitHub Crawler** | Crawls a candidate's 5 most recently updated repositories, analyzes tech stack, README quality, and code activity, and flags whether resume claims are supported by evidence |
| **HR Email** | Composes 4–5 personalized screening questions and sends them via Gmail; a separate background process polls for replies at no additional AI cost |
| **Scorecard** | Combines the ML match score (45%) and GitHub evidence score (55%) into a final weighted verdict — STRONG HIRE / HIRE / HOLD / REJECT |

Agents run sequentially using CrewAI, with each agent's output feeding into the next stage of evaluation.

---

## Fairness Considerations

- Semantic matching never penalizes candidates for differing terminology (e.g. "ML" vs "Machine Learning")
- Email reply content is excluded from scoring to avoid bias based on communication style
- Missing GitHub activity is explicitly treated as "unverifiable," not as a negative signal
- All AI-generated verdicts are recommendations — the recruiter makes the final hiring decision
- Hired candidates are soft-excluded (not deleted) and can be reactivated if needed

---

## Future Work

- Migrate from SQLite to PostgreSQL with `pgvector` for production-scale vector search
- Add job-specific posting and application flows alongside the talent pool model
- Introduce asynchronous task queuing (e.g. Celery) for parallel agent execution
- Apply cross-encoder re-ranking on the top shortlist for additional precision
- Build a recruiter-facing analytics dashboard

---

## License

This project was built as a Final Year Project for academic purposes.

---

## Author

Sanawer Batool — sanawerb246@gmail.com

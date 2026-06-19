from pydantic import BaseModel
from typing import Optional, List, Dict

# Used when ADDING a new candidate (POST)
class CandidateCreate(BaseModel):
    name: str
    email: str
    skills: List[str]
    resume_text: str
    github_url: Optional[str] = ""
    portfolio_url: Optional[str] = ""
    availability: str   # freelance | full-time | project-based | Internship
    location: str       # remote | hybrid | on-site
    years_experience: int
    applying_for: Optional[str] = None

# Used when UPDATING a candidate (PUT)
# Everything is Optional because you might only update one field
class CandidateUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    skills: Optional[List[str]] = None
    resume_text: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    availability: Optional[str] = None
    location: Optional[str] = None
    years_experience: Optional[int] = None
    applying_for: Optional[str] = None

# Request body for the match endpoint
class MatchRequest(BaseModel):
    job_description: str
    availability: Optional[str] = None   # if None, don't filter
    location: Optional[str] = None       # if None, don't filter
    experience: Optional[str] = None     # if None, don't filter
    top_n: Optional[int] = 5             # how many results to return

# What each result looks like in the response
class MatchResult(BaseModel):
    id: int
    name: str
    email: str
    skills: str
    resume_text: str
    availability: str
    location: str
    years_experience: int
    match_score: float

class AgentRunRequest(BaseModel):
    candidate_ids: List[int]
    job_description: str
    role_applied: Optional[str] = None
    job_run_id: Optional[int] = None


class EmailAgentRequest(BaseModel):
    candidate_ids: List[int]
    job_description: str
    role_applied: Optional[str] = None
    job_run_id: Optional[int] = None

class ScorecardRequest(BaseModel):
    candidate_ids: List[int]
    job_description: str
    role_applied: Optional[str] = None
    job_run_id: Optional[int] = None


class CreateJobRunRequest(BaseModel):
    job_title: str
    job_description: str
    role_applied: Optional[str] = None
    availability: Optional[str] = None
    location: Optional[str] = None
    candidate_ids: List[int]
    ml_scores: Dict[str, float]


class CandidateDisposition(BaseModel):
    candidate_id: int
    disposition: str


class CloseJobRunRequest(BaseModel):
    dispositions: List[CandidateDisposition]
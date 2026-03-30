from pydantic import BaseModel
from typing import Optional, List

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
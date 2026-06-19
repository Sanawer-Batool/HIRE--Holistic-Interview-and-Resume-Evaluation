from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from candidates_db import create_table
from backend.routes.candidates import router as candidates_router
from backend.routes.matching import router as matching_router 
from backend.routes.agents import router as agents_router
from backend.routes.job_runs import router as job_runs_router
from backend.routes.resume import router as resume_router 

app = FastAPI(title="HIRE API")

# This allows your Next.js frontend to talk to this backend
# Without this, the browser will block requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js runs on 3000
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(candidates_router, prefix="/api")
app.include_router(matching_router, prefix="/api")
app.include_router(agents_router, prefix="/api")  
app.include_router(job_runs_router, prefix="/api")
app.include_router(resume_router, prefix="/api")


@app.on_event("startup")
def ensure_database_schema():
    create_table()

@app.get("/")
def root():
    return {"message": "HIRE API is running"}
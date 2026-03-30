from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes.candidates import router as candidates_router

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

@app.get("/")
def root():
    return {"message": "HIRE API is running"}
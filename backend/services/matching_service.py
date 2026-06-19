from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# Load the model once when the file is imported
# This model is small, fast, and great for comparing text similarity
# It downloads automatically the first time, then caches locally
model = SentenceTransformer("all-MiniLM-L6-v2")


def match_candidates(job_description: str, candidates: list, top_n: int = 5):
    """
    Takes a job description and a list of candidates from the DB,
    returns top N candidates ranked by how well their resume matches.
    """

    # Step 1 — encode the job description into a vector (list of numbers)
    # This turns text into math that we can compare
    jd_vector = model.encode([job_description])

    # Step 2 — encode every candidate's resume_text into vectors
    resumes = []
    for candidate in candidates:
        resume_text = candidate.get("resume_text", "")
        applying_for = candidate.get("applying_for", "")

        if applying_for and applying_for.strip():
            resumes.append(f"{resume_text} Interested in: {applying_for}")
        else:
            resumes.append(resume_text)

    resume_vectors = model.encode(resumes)

    # Step 3 — calculate similarity score between JD and each resume
    # cosine_similarity returns a value between 0 and 1
    # 1 = perfect match, 0 = completely different
    scores = cosine_similarity(jd_vector, resume_vectors)[0]

    # Step 4 — attach the score to each candidate
    for i, candidate in enumerate(candidates):
        candidate["match_score"] = round(float(scores[i]), 4)

    # Step 5 — sort by score, highest first, return top N
    ranked = sorted(candidates, key=lambda x: x["match_score"], reverse=True)
    return ranked[:top_n]
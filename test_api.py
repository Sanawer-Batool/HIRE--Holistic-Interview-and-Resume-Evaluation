import requests

url = "http://localhost:8000/api/match"

payload = {
    "job_description": "Looking for a backend Python developer with FastAPI and SQL experience. Minimum 3 years required.",
    "availability": "full-time",
    "location": "remote",
    "top_n": 5
}

response = requests.post(url, json=payload)

print(f"Status code: {response.status_code}")

if response.status_code != 200:
    print("Error:", response.text)
else:
    data = response.json()

    print("\nFULL RESPONSE:")
    print(data)   # 👈 IMPORTANT: shows real structure

    # 🔥 Handle different possible response formats safely
    if isinstance(data, list):
        candidates = data
    elif isinstance(data, dict):
        # try common keys
        candidates = data.get("matches") or data.get("candidates") or data.get("results") or []
    else:
        print("Unexpected response format")
        candidates = []

    print(f"\nNumber of candidates returned: {len(candidates)}\n")

    for i, candidate in enumerate(candidates, 1):
        print(f"Rank {i}: {candidate.get('name')}")
        print(f"  Score: {candidate.get('score')}")
        print(f"  Availability: {candidate.get('availability')}")
        print(f"  Location: {candidate.get('location')}")
        print()
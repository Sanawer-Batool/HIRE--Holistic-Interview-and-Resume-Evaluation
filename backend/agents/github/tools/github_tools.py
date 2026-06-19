import os
import requests
from crewai.tools import tool

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")

def _headers() -> dict:
    """Returns auth headers for GitHub API calls."""
    return {
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json",
    }


@tool("get_github_profile")
def get_github_profile(username: str) -> str:
    """
    Fetches a candidate's GitHub profile information including bio,
    public repo count, followers, and account creation date.

    Args:
        username: The GitHub username of the candidate.

    Returns:
        A formatted string with the candidate's profile information.
    """
    try:
        url = f"https://api.github.com/users/{username}"
        response = requests.get(url, headers=_headers(), timeout=10)

        if response.status_code == 404:
            return f"GitHub user '{username}' not found."
        if response.status_code != 200:
            return f"GitHub API error: {response.status_code} — {response.text}"

        data = response.json()

        return (
            f"GitHub Profile: {data.get('login')}\n"
            f"Name          : {data.get('name', 'N/A')}\n"
            f"Bio           : {data.get('bio', 'N/A')}\n"
            f"Location      : {data.get('location', 'N/A')}\n"
            f"Public Repos  : {data.get('public_repos', 0)}\n"
            f"Followers     : {data.get('followers', 0)}\n"
            f"Following     : {data.get('following', 0)}\n"
            f"Account Created: {data.get('created_at', 'N/A')}\n"
            f"Profile URL   : {data.get('html_url', 'N/A')}\n"
            f"Blog/Portfolio: {data.get('blog', 'N/A')}\n"
        )

    except Exception as e:
        return f"Error fetching GitHub profile: {str(e)}"


@tool("get_github_repos")
def get_github_repos(username: str) -> str:
    """
    Fetches the 5 most recently updated public repositories of a GitHub user.

    Args:
        username: The GitHub username of the candidate.

    Returns:
        A formatted string listing recently updated repositories with details.
    """
    try:
        url = f"https://api.github.com/users/{username}/repos"
        params = {
            "sort": "updated",
            "direction": "desc",
            "per_page": 5,
            "type": "owner",  # only their own repos, not forks
        }
        response = requests.get(url, headers=_headers(), params=params)

        if response.status_code != 200:
            return f"GitHub API error: {response.status_code} — {response.text}"

        repos = response.json()

        if not repos:
            return f"No public repositories found for user '{username}'."

        result = f"Recently Updated Repositories for {username}:\n"
        result += "─" * 50 + "\n"

        for i, repo in enumerate(repos, 1):
            result += (
                f"{i}. {repo.get('name')}\n"
                f"   Description : {repo.get('description', 'No description')}\n"
                f"   Language    : {repo.get('language', 'N/A')}\n"
                f"   Stars       : {repo.get('stargazers_count', 0)}\n"
                f"   Forks       : {repo.get('forks_count', 0)}\n"
                f"   Updated     : {repo.get('updated_at', 'N/A')[:10]}\n"
                f"   URL         : {repo.get('html_url')}\n\n"
            )

        return result

    except Exception as e:
        return f"Error fetching repositories: {str(e)}"


@tool("get_repo_languages")
def get_repo_languages(username_and_repo: str) -> str:
    """
    Fetches the programming languages used in a specific repository.

    Args:
        username_and_repo: A string in the format 'username/repo_name'
                           e.g. 'torvalds/linux'

    Returns:
        A formatted string showing language breakdown for the repository.
    """
    try:
        if "/" not in username_and_repo:
            return "Invalid format. Please provide 'username/repo_name'."

        url = f"https://api.github.com/repos/{username_and_repo}/languages"
        response = requests.get(url, headers=_headers())

        if response.status_code == 404:
            return f"Repository '{username_and_repo}' not found."
        if response.status_code != 200:
            return f"GitHub API error: {response.status_code} — {response.text}"

        languages = response.json()

        if not languages:
            return f"No language data found for '{username_and_repo}'."

        total_bytes = sum(languages.values())
        result = f"Languages in {username_and_repo}:\n"

        for lang, bytes_count in sorted(languages.items(), key=lambda x: x[1], reverse=True):
            percentage = (bytes_count / total_bytes) * 100
            result += f"  {lang}: {percentage:.1f}%\n"

        return result

    except Exception as e:
        return f"Error fetching languages: {str(e)}"


@tool("get_repo_readme")
def get_repo_readme(username_and_repo: str) -> str:
    """
    Fetches and returns the README content of a GitHub repository.

    Args:
        username_and_repo: A string in the format 'username/repo_name'
                           e.g. 'torvalds/linux'

    Returns:
        The README content as plain text (truncated to 2000 chars to save tokens).
    """
    try:
        if "/" not in username_and_repo:
            return "Invalid format. Please provide 'username/repo_name'."

        url = f"https://api.github.com/repos/{username_and_repo}/readme"
        response = requests.get(url, headers=_headers())

        if response.status_code == 404:
            return f"No README found for '{username_and_repo}'."
        if response.status_code != 200:
            return f"GitHub API error: {response.status_code} — {response.text}"

        import base64
        data = response.json()
        content_encoded = data.get("content", "")
        content = base64.b64decode(content_encoded).decode("utf-8", errors="ignore")

        # Truncate to avoid blowing up the context window
        if len(content) > 2000:
            content = content[:2000] + "\n\n[... README truncated for brevity ...]"

        return f"README for {username_and_repo}:\n\n{content}"

    except Exception as e:
        return f"Error fetching README: {str(e)}"


@tool("get_candidate_github_report")
def get_candidate_github_report(username: str) -> str:
    """
    Builds a complete GitHub report in one tool call:
    profile, recent repos, languages per recent repo, and README highlights for top 3 repos.
    """
    try:
        sections = []

        profile = get_github_profile(username)
        sections.append(profile)

        repos_text = get_github_repos(username)
        sections.append(repos_text)

        # Fetch repos once as structured data so we can reliably pick recent repos.
        repos_url = f"https://api.github.com/users/{username}/repos"
        repos_params = {
            "sort": "updated",
            "direction": "desc",
            "per_page": 5,
            "type": "owner",
        }
        repos_response = requests.get(repos_url, headers=_headers(), params=repos_params)
        if repos_response.status_code != 200:
            sections.append(
                f"Could not fetch repo list for deep analysis: "
                f"{repos_response.status_code} — {repos_response.text}"
            )
            return "\n\n".join(sections)

        repos = repos_response.json() or []
        if not repos:
            sections.append("No repositories found for language and README analysis.")
            return "\n\n".join(sections)

        language_blocks = []
        for repo in repos:
            full_name = repo.get("full_name")
            if not full_name:
                continue
            language_blocks.append(get_repo_languages(full_name))

        if language_blocks:
            sections.append("Language Breakdown Across Recent Repos:\n" + "\n".join(language_blocks))

        readme_blocks = []
        for repo in repos[:3]:
            full_name = repo.get("full_name")
            if not full_name:
                continue
            readme_blocks.append(get_repo_readme(full_name))

        if readme_blocks:
            sections.append("README Highlights (Top 3 Recent Repos):\n" + "\n\n".join(readme_blocks))

        return "\n\n".join(sections)
    except Exception as e:
        return f"Error building candidate GitHub report: {str(e)}"
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root (three levels up from this file)
load_dotenv(Path(__file__).resolve().parents[3] / ".env")

from crewai import Agent, Task, Crew, Process
from crewai.project import CrewBase, agent, task, crew
from backend.agents.github.tools.github_tools import (
    get_github_profile,
    get_github_repos,
    get_repo_languages,
    get_repo_readme,
    get_candidate_github_report,
)

# Absolute paths so CrewAI finds configs regardless of
# where uvicorn is launched from
_BASE = Path(__file__).resolve().parent


@CrewBase
class GithubCrawlerCrew:
    """GitHub Crawler Crew — analyzes a candidate's GitHub and scores fit."""

    agents_config = str(_BASE / "config" / "agents.yaml")
    tasks_config  = str(_BASE / "config" / "tasks.yaml")
    llm_model     = os.getenv("MODEL", "openai/gpt-4o-mini")

    @agent
    def github_scraper_agent(self) -> Agent:
        return Agent(
            config=self.agents_config["github_scraper_agent"],
            tools=[
                get_candidate_github_report,
                get_github_profile,
                get_github_repos,
                get_repo_languages,
                get_repo_readme,
            ],
            llm=self.llm_model,
            verbose=True,
        )

    @agent
    def summary_agent(self) -> Agent:
        return Agent(
            config=self.agents_config["summary_agent"],
            tools=[],
            llm=self.llm_model,
            verbose=True,
        )

    @task
    def scrape_github_task(self) -> Task:
        return Task(
            config=self.tasks_config["scrape_github_task"],
            agent=self.github_scraper_agent(),
        )

    @task
    def compile_github_report_task(self) -> Task:
        return Task(
            config=self.tasks_config["compile_github_report_task"],
            agent=self.summary_agent(),
            context=[self.scrape_github_task()],
        )

    @crew
    def crew(self) -> Crew:
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,
            verbose=True,
        )

    def run_for_candidate(
        self,
        github_username: str,
        role_applied: str,
        job_description: str
    ) -> str:
        """Called by FastAPI — runs the full crew for one candidate."""
        inputs = {
            "github_username": github_username,
            "role_applied": role_applied,
            "job_description": job_description,
        }
        result = self.crew().kickoff(inputs=inputs)
        return str(result)
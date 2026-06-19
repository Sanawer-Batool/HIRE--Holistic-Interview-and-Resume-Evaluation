import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[3] / ".env")

from crewai import Agent, Task, Crew, Process
from crewai.project import CrewBase, agent, task, crew

_BASE = Path(__file__).resolve().parent


@CrewBase
class ScorecardAgentCrew:
    """
    Scorecard Agent — synthesizes ML match score + GitHub report
    into a full candidate hiring report. No tools needed, pure reasoning.
    """

    agents_config = str(_BASE / "config" / "agents.yaml")
    tasks_config  = str(_BASE / "config" / "tasks.yaml")

    @agent
    def candidate_scoring_agent(self) -> Agent:
        return Agent(
            config=self.agents_config["candidate_scoring_agent"],
            tools=[],
            llm="openai/gpt-4o-mini",
            verbose=True,
        )

    @task
    def generate_hiring_report_task(self) -> Task:
        return Task(
            config=self.tasks_config["generate_hiring_report_task"],
            agent=self.candidate_scoring_agent(),
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
        candidate_name: str,
        candidate_email: str,
        role_applied: str,
        job_description: str,
        ml_match_score: str,
        github_summary: str,
    ) -> str:
        """Called by FastAPI — runs scorecard for one candidate."""
        inputs = {
            "candidate_name":  candidate_name,
            "candidate_email": candidate_email,
            "role_applied":    role_applied,
            "job_description": job_description,
            "ml_match_score":  ml_match_score,
            "github_summary":  github_summary,
        }
        result = self.crew().kickoff(inputs=inputs)
        return str(result)
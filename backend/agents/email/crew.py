import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[3] / ".env")

from crewai import Agent, Task, Crew, Process
from crewai.project import CrewBase, agent, task, crew
from backend.agents.email.tools.email_tools import send_hr_email

_BASE = Path(__file__).resolve().parent


@CrewBase
class HrEmailAgentCrew:
    """HR Email Agent Crew — composes and sends HR screening questions."""

    agents_config = str(_BASE / "config" / "agents.yaml")
    tasks_config  = str(_BASE / "config" / "tasks.yaml")

    def __init__(self):
        if not os.environ.get("OPENAI_API_KEY"):
            raise ValueError("OPENAI_API_KEY is not set")
        self.llm = "openai/gpt-4o-mini"

    @agent
    def question_composer_agent(self) -> Agent:
        return Agent(
            config=self.agents_config["question_composer_agent"],
            tools=[send_hr_email],
            llm=self.llm,
            verbose=True,
        )

    @task
    def compose_and_send_task(self) -> Task:
        return Task(
            config=self.tasks_config["compose_and_send_task"],
            agent=self.question_composer_agent(),
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
        candidate_id: int,
        candidate_name: str,
        candidate_email: str,
        role_applied: str,
        job_description: str
    ) -> str:
        """Called by FastAPI — runs the email crew for one candidate."""
        inputs = {
            "candidate_id":    candidate_id,
            "candidate_name":  candidate_name,
            "candidate_email": candidate_email,
            "role_applied":    role_applied,
            "job_description": job_description,
        }
        result = self.crew().kickoff(inputs=inputs)
        return str(result)
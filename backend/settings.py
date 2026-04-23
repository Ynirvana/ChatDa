from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    nextauth_secret: str
    # Comma-separated admin emails, e.g. "dykim9304@gmail.com,another@x.com"
    admin_emails: str = ""
    # "production" → @chatda.test seed 유저 자동 필터. dev에선 기본값 그대로 두면 seed 노출됨.
    environment: str = "development"

    @property
    def admin_email_list(self) -> list[str]:
        return [e.strip().lower() for e in self.admin_emails.split(",") if e.strip()]

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    class Config:
        env_file = (".env", ".env.local")
        env_file_encoding = "utf-8"


settings = Settings()

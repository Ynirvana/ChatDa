from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    nextauth_secret: str
    # Comma-separated admin emails, e.g. "dykim9304@gmail.com,another@x.com"
    admin_emails: str = ""

    @property
    def admin_email_list(self) -> list[str]:
        return [e.strip().lower() for e in self.admin_emails.split(",") if e.strip()]

    class Config:
        env_file = (".env", ".env.local")
        env_file_encoding = "utf-8"


settings = Settings()

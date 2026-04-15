from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    nextauth_secret: str
    host_email: str = ""

    class Config:
        env_file = (".env", ".env.local")
        env_file_encoding = "utf-8"


settings = Settings()

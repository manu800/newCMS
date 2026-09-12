from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    mongo_uri: str = "mongodb://localhost:27017"
    mongo_db_name: str = "cms_pwa_platform"

    redis_url: str = "redis://localhost:6379/0"

    jwt_secret: str = "change-this-dev-secret"
    jwt_algorithm: str = "HS256"
    jwt_expires_minutes: int = 1440

    cors_origins: str = "http://localhost:3000,http://localhost:3001"

    seed_admin_email: str = "shailendra@hook.online"
    seed_admin_password: str = "admin123"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()

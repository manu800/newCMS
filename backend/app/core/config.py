from pydantic import Field
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

    # S3 asset storage — optional. When unset, asset uploads fall back to
    # local disk (backend/uploads/) so the app keeps working either way.
    # validation_alias matches this project's .env naming (AWS_ACCESS_KEY /
    # AWS_SECRET_KEY / AWS_BUCKET) rather than the AWS-SDK-style names.
    aws_access_key_id: str = Field(default="", validation_alias="AWS_ACCESS_KEY")
    aws_secret_access_key: str = Field(default="", validation_alias="AWS_SECRET_KEY")
    aws_region: str = "us-east-1"
    s3_bucket_name: str = Field(default="", validation_alias="AWS_BUCKET")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def s3_enabled(self) -> bool:
        return bool(self.aws_access_key_id and self.aws_secret_access_key and self.s3_bucket_name)


settings = Settings()

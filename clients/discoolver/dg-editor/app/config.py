from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env", extra="ignore")

    # ── AI ─────────────────────────────────────────────────────────────────────
    anthropic_api_key: str = ""
    freepik_api_key: str = ""

    # ── Database ───────────────────────────────────────────────────────────────
    database_url: str = "sqlite+aiosqlite:///./dev.db"

    # ── Object Storage (Cloudflare R2, S3-compatible) ─────────────────────────
    # DO_SPACES_* var names kept for backwards compat — map to R2 values in .env
    do_spaces_key: str = ""      # R2 Access Key ID
    do_spaces_secret: str = ""   # R2 Secret Access Key
    do_spaces_bucket: str = "discoolver"
    do_spaces_region: str = "auto"   # R2 uses "auto"
    do_spaces_endpoint: str = ""     # R2 jurisdiction endpoint from CF dashboard
    do_spaces_cdn_base: str = ""     # Optional: custom domain for public URLs

    # ── Auth ───────────────────────────────────────────────────────────────────
    secret_key: str = "discoolver-dev-secret-key-change-in-production"
    jwt_secret: str = "discoolver-dev-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 10080  # 7 days
    access_token_expire_minutes: int = 1440

    # ── CMS bridge ─────────────────────────────────────────────────────────────
    cms_base_url: str = ""   # e.g. https://cms.discoolver.com
    cms_api_key: str = ""    # optional server-to-server key

    # ── CMS API (api.discoolver.com) ───────────────────────────────────────────
    cms_api_url: str = "https://api.discoolver.com"
    cms_api_user: str = "atenea"
    cms_api_password: str = ""   # Set in .env: CMS_API_PASSWORD=Discoolcms1!

    # ── Instagram / Meta ───────────────────────────────────────────────────────
    instagram_app_id: str = ""
    instagram_app_secret: str = ""
    instagram_redirect_uri: str = "http://localhost:8000/api/v2/instagram/callback"
    # Separate redirect URI for user-level (influencer) OAuth flow
    instagram_user_redirect_uri: str = "http://localhost:8000/api/v2/instagram/user-callback"

    # ── Server ─────────────────────────────────────────────────────────────────
    host: str = "0.0.0.0"
    port: int = 8000
    environment: str = "development"

    # ── CORS ────────────────────────────────────────────────────────────────────
    # Comma-separated list of allowed origins, or "*" for development
    # Example: "https://editor.discoolver.com,https://discoolver.com"
    cors_origins: str = "*"

    # ── Email / SMTP ────────────────────────────────────────────────────────────
    email_enabled: bool = False        # Set True in production
    smtp_host: str = ""                # e.g. smtp.gmail.com or smtp.sendgrid.net
    smtp_port: int = 587               # 587=STARTTLS, 465=SSL, 25=plain
    smtp_user: str = ""
    smtp_password: str = ""
    email_from: str = "Discoolver <hola@discoolver.com>"
    admin_email: str = "hola@discoolver.com"  # receives new application notifications
    portal_url: str = "https://discoolver.com/portal"

    # ── Rate limiting ───────────────────────────────────────────────────────────
    ai_rate_limit: int = 20    # calls per window
    ai_rate_window: int = 60   # seconds

    @property
    def cors_origins_list(self) -> list[str]:
        if self.cors_origins == "*":
            return ["*"]
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    # ── Legacy file storage ────────────────────────────────────────────────────
    guides_data_dir: Path = BASE_DIR / "data" / "guides"
    exports_dir: Path = BASE_DIR / "exports"
    templates_dir: Path = BASE_DIR / "templates"
    static_dir: Path = BASE_DIR / "static"


settings = Settings()

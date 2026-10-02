from typing import Any

from flask import Flask
from flask_cors import CORS

from app.config import Config
from app.db import close_session, init_db
from app.errors import register_error_handlers


def create_app(overrides: dict[str, Any] | None = None) -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)
    if overrides:
        app.config.update(overrides)

    if not app.config["DATABASE_URL"]:
        raise RuntimeError("DATABASE_URL is not set. Copy .env.example to .env and fill it in.")
    if not app.config["SECRET_KEY"]:
        raise RuntimeError("SECRET_KEY is not set. Copy .env.example to .env and fill it in.")

    init_db(app.config["DATABASE_URL"])
    app.teardown_appcontext(close_session)
    CORS(app, origins=app.config["CORS_ORIGINS"])
    register_error_handlers(app)
    app.json.sort_keys = False  # type: ignore[attr-defined]

    from app.cli import register_cli
    from app.routes import register_blueprints

    register_blueprints(app)
    register_cli(app)
    return app

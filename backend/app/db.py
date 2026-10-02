from typing import Any

from flask import g
from sqlalchemy import Engine, create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker


class Base(DeclarativeBase):
    pass


SessionLocal = sessionmaker(expire_on_commit=False)


def normalize_db_url(url: str) -> str:
    """Neon hands out postgresql:// URLs; force the psycopg (v3) driver."""
    url = url.strip()
    for prefix in ("postgres://", "postgresql://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url[len(prefix):]
    return url


def init_db(url: str) -> Engine:
    url = normalize_db_url(url)
    if url.startswith("sqlite"):
        engine = create_engine(url)

        @event.listens_for(engine, "connect")
        def _enable_foreign_keys(dbapi_conn: Any, _record: Any) -> None:
            dbapi_conn.execute("PRAGMA foreign_keys=ON")
    else:
        # Neon closes idle connections, so check them before use.
        engine = create_engine(url, pool_pre_ping=True, pool_recycle=300)
    SessionLocal.configure(bind=engine)
    return engine


def get_session() -> Session:
    if "db_session" not in g:
        g.db_session = SessionLocal()
    return g.db_session


def close_session(_exc: BaseException | None = None) -> None:
    session = g.pop("db_session", None)
    if session is not None:
        session.close()

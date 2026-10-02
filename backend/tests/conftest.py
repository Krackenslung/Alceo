from collections.abc import Iterator
from datetime import date

import pytest
from flask import Flask
from flask.testing import FlaskClient
from sqlalchemy.orm import Session

import app.models  # noqa: F401
from app import create_app
from app.db import Base, SessionLocal
from app.models import Exercise, User
from app.services.auth import hash_password, issue_token

SECRET = "test-secret"


@pytest.fixture()
def flask_app(tmp_path) -> Iterator[Flask]:
    app = create_app(
        {
            "TESTING": True,
            "DATABASE_URL": f"sqlite:///{tmp_path / 'test.db'}",
            "SECRET_KEY": SECRET,
            "GEMINI_API_KEY": "fake-key",
            "MIN_AGE": 16,
        }
    )
    Base.metadata.create_all(SessionLocal.kw["bind"])
    yield app


@pytest.fixture()
def client(flask_app: Flask) -> FlaskClient:
    return flask_app.test_client()


@pytest.fixture()
def session(flask_app: Flask) -> Iterator[Session]:
    with SessionLocal() as s:
        yield s


def make_user(session: Session, email: str, status: str = "active") -> User:
    user = User(
        name=email.split("@")[0],
        email=email,
        password_hash=hash_password("password123"),
        status=status,
        sex="male",
        date_of_birth=date(1995, 5, 5),
        height_cm=180,
        weight_kg=80,
    )
    session.add(user)
    session.commit()
    return user


def auth_header(user: User) -> dict[str, str]:
    return {"Authorization": f"Bearer {issue_token(user.id, SECRET)}"}


@pytest.fixture()
def alice(session: Session) -> User:
    return make_user(session, "alice@example.com")


@pytest.fixture()
def bob(session: Session) -> User:
    return make_user(session, "bob@example.com")


@pytest.fixture()
def exercises(session: Session) -> list[Exercise]:
    items = [
        Exercise(name="Back Squat", category="strength", primary_muscle="quadriceps", equipment="barbell"),
        Exercise(name="Push-Up", category="strength", primary_muscle="chest", equipment="bodyweight"),
        Exercise(name="Leg Press", category="strength", primary_muscle="quadriceps", equipment="machine"),
    ]
    session.add_all(items)
    session.commit()
    return items

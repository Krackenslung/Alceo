from datetime import date
from typing import Any

from sqlalchemy.orm import Session

from app.errors import ApiError
from app.models import User

PROFILE_FIELDS = ("sex", "date_of_birth", "height_cm", "weight_kg")


def compute_age(date_of_birth: date, today: date) -> int:
    had_birthday = (today.month, today.day) >= (date_of_birth.month, date_of_birth.day)
    return today.year - date_of_birth.year - (0 if had_birthday else 1)


def passes_age_gate(date_of_birth: date, today: date, min_age: int) -> bool:
    return compute_age(date_of_birth, today) >= min_age


def update_profile(session: Session, user: User, changes: dict[str, Any], min_age: int, today: date) -> User:
    for key, value in changes.items():
        setattr(user, key, value)
    if user.date_of_birth is not None and not passes_age_gate(user.date_of_birth, today, min_age):
        user.status = "blocked"
    session.commit()
    return user


def complete_onboarding(session: Session, user: User, min_age: int, today: date) -> User:
    if user.status != "onboarding":
        raise ApiError(409, "not_onboarding", "Onboarding is already complete.")
    missing = [f for f in PROFILE_FIELDS if getattr(user, f) is None]
    if missing:
        raise ApiError(400, "profile_incomplete", f"Missing profile fields: {', '.join(missing)}")
    assert user.date_of_birth is not None
    user.status = "active" if passes_age_gate(user.date_of_birth, today, min_age) else "blocked"
    session.commit()
    return user


def delete_account(session: Session, user: User) -> None:
    user.status = "deleted"
    session.commit()

from typing import Any

from sqlalchemy import ColumnElement, func, or_, select
from sqlalchemy.orm import Session

from app.errors import ApiError
from app.models import Exercise
from app.schemas.requests import ExerciseIn


def visible_to(user_id: int) -> ColumnElement[bool]:
    return or_(Exercise.created_by_user_id.is_(None), Exercise.created_by_user_id == user_id)


def list_exercises(
    session: Session,
    user_id: int,
    category: str | None = None,
    equipment: str | None = None,
    search: str | None = None,
) -> list[Exercise]:
    query = select(Exercise).where(visible_to(user_id), Exercise.is_active.is_(True))
    if category:
        query = query.where(Exercise.category == category)
    if equipment:
        query = query.where(Exercise.equipment == equipment)
    if search:
        query = query.where(func.lower(Exercise.name).contains(search.lower()))
    return list(session.scalars(query.order_by(Exercise.name)))


def get_visible_exercise(session: Session, user_id: int, exercise_id: int) -> Exercise:
    item = session.scalars(select(Exercise).where(Exercise.id == exercise_id, visible_to(user_id))).first()
    if item is None:
        raise ApiError(404, "not_found", "Exercise not found.")
    return item


def get_usable_exercise(session: Session, user_id: int, exercise_id: int) -> Exercise:
    item = get_visible_exercise(session, user_id, exercise_id)
    if not item.is_active:
        raise ApiError(400, "exercise_inactive", "This exercise is no longer available.")
    return item


def _get_own_exercise(session: Session, user_id: int, exercise_id: int) -> Exercise:
    item = get_visible_exercise(session, user_id, exercise_id)
    if item.created_by_user_id != user_id:
        raise ApiError(403, "forbidden", "Built-in exercises cannot be changed.")
    return item


def _ensure_name_free(session: Session, name: str, exclude_id: int | None = None) -> None:
    query = select(Exercise.id).where(func.lower(Exercise.name) == name.lower())
    if exclude_id is not None:
        query = query.where(Exercise.id != exclude_id)
    if session.scalars(query).first() is not None:
        raise ApiError(409, "name_taken", "An exercise with this name already exists.")


def create_exercise(session: Session, user_id: int, data: ExerciseIn) -> Exercise:
    _ensure_name_free(session, data.name)
    item = Exercise(created_by_user_id=user_id, **data.model_dump())
    session.add(item)
    session.commit()
    return item


def update_exercise(session: Session, user_id: int, exercise_id: int, changes: dict[str, Any]) -> Exercise:
    item = _get_own_exercise(session, user_id, exercise_id)
    if "name" in changes:
        _ensure_name_free(session, changes["name"], exclude_id=item.id)
    for key, value in changes.items():
        setattr(item, key, value)
    session.commit()
    return item


def deactivate_exercise(session: Session, user_id: int, exercise_id: int) -> None:
    item = _get_own_exercise(session, user_id, exercise_id)
    item.is_active = False
    session.commit()

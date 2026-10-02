from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.errors import ApiError
from app.models import UserFilter
from app.schemas.requests import FilterIn, check_equipment_word


def list_filters(session: Session, user_id: int, include_inactive: bool = False) -> list[UserFilter]:
    query = select(UserFilter).where(UserFilter.user_id == user_id)
    if not include_inactive:
        query = query.where(UserFilter.is_active.is_(True))
    return list(session.scalars(query.order_by(UserFilter.filter_type, UserFilter.priority, UserFilter.id)))


def get_filter(session: Session, user_id: int, filter_id: int) -> UserFilter:
    item = session.scalars(
        select(UserFilter).where(UserFilter.id == filter_id, UserFilter.user_id == user_id)
    ).first()
    if item is None:
        raise ApiError(404, "not_found", "Filter not found.")
    return item


def create_filter(session: Session, user_id: int, data: FilterIn) -> UserFilter:
    item = UserFilter(user_id=user_id, **data.model_dump())
    session.add(item)
    session.commit()
    return item


def update_filter(session: Session, user_id: int, filter_id: int, changes: dict[str, Any]) -> UserFilter:
    item = get_filter(session, user_id, filter_id)
    if item.filter_type == "equipment" and "description" in changes:
        changes["description"] = changes["description"].lower()
        try:
            check_equipment_word(item.filter_type, changes["description"])
        except ValueError as exc:
            raise ApiError(400, "validation_error", str(exc)) from exc
    for key, value in changes.items():
        setattr(item, key, value)
    session.commit()
    return item


def deactivate_filter(session: Session, user_id: int, filter_id: int) -> None:
    item = get_filter(session, user_id, filter_id)
    item.is_active = False
    session.commit()

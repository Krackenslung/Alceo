from collections.abc import Callable
from functools import wraps
from typing import Any, TypeVar, cast

from flask import current_app, g, request

from app.db import get_session
from app.errors import ApiError
from app.models import User
from app.services.auth import read_token

F = TypeVar("F", bound=Callable[..., Any])


def _load_user(allow_blocked: bool) -> User:
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        raise ApiError(401, "unauthorized", "Missing bearer token.")
    user_id = read_token(
        header.removeprefix("Bearer ").strip(),
        current_app.config["SECRET_KEY"],
        current_app.config["TOKEN_MAX_AGE_SECONDS"],
    )
    user = get_session().get(User, user_id)
    if user is None or user.status == "deleted":
        raise ApiError(401, "unauthorized", "Account not found.")
    if user.status == "blocked" and not allow_blocked:
        raise ApiError(403, "account_blocked", "This account is blocked.")
    return user


def _make(allow_blocked: bool) -> Callable[[F], F]:
    def decorator(view: F) -> F:
        @wraps(view)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            g.user = _load_user(allow_blocked)
            return view(*args, **kwargs)

        return cast(F, wrapper)

    return decorator


login_required = _make(allow_blocked=False)
login_required_allow_blocked = _make(allow_blocked=True)


def current_user() -> User:
    return g.user

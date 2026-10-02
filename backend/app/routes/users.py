from datetime import date

from flask import Blueprint, current_app, jsonify

from app.auth import current_user, login_required, login_required_allow_blocked
from app.db import get_session
from app.routes._helpers import parse_body
from app.schemas.requests import ProfileUpdateIn
from app.schemas.serializers import user_to_dict
from app.services import users as users_service

bp = Blueprint("users", __name__)


@bp.get("/me")
@login_required_allow_blocked
def get_me():
    return jsonify(user_to_dict(current_user()))


@bp.patch("/me")
@login_required
def update_me():
    changes = parse_body(ProfileUpdateIn).model_dump(exclude_unset=True)
    user = users_service.update_profile(
        get_session(), current_user(), changes, current_app.config["MIN_AGE"], date.today()
    )
    return jsonify(user_to_dict(user))


@bp.post("/me/complete-onboarding")
@login_required
def complete_onboarding():
    user = users_service.complete_onboarding(
        get_session(), current_user(), current_app.config["MIN_AGE"], date.today()
    )
    return jsonify(user_to_dict(user))


@bp.delete("/me")
@login_required_allow_blocked
def delete_me():
    users_service.delete_account(get_session(), current_user())
    return "", 204

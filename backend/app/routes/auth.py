from flask import Blueprint, current_app, jsonify

from app.auth import current_user, login_required_allow_blocked
from app.db import get_session
from app.errors import ApiError
from app.models import User
from app.routes._helpers import parse_body
from app.schemas.requests import GoogleLoginIn, LoginIn, RegisterIn
from app.schemas.serializers import user_to_dict
from app.services import auth as auth_service

bp = Blueprint("auth", __name__)


def _session_payload(user: User) -> dict:
    token = auth_service.issue_token(user.id, current_app.config["SECRET_KEY"])
    return {"token": token, "user": user_to_dict(user)}


@bp.post("/register")
def register():
    data = parse_body(RegisterIn)
    user = auth_service.register(get_session(), data.name, data.email, data.password)
    return jsonify(_session_payload(user)), 201


@bp.post("/login")
def login():
    data = parse_body(LoginIn)
    user = auth_service.login(get_session(), data.email, data.password)
    return jsonify(_session_payload(user))


@bp.post("/google")
def google():
    client_id = current_app.config["GOOGLE_CLIENT_ID"]
    if not client_id:
        raise ApiError(503, "google_not_configured", "GOOGLE_CLIENT_ID is not set on the server.")
    data = parse_body(GoogleLoginIn)
    claims = auth_service.verify_google_token(data.id_token, client_id)
    user = auth_service.google_login(get_session(), claims)
    return jsonify(_session_payload(user))


@bp.get("/me")
@login_required_allow_blocked
def me():
    return jsonify(user_to_dict(current_user()))

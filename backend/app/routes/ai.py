from datetime import date

from flask import Blueprint, current_app, jsonify
from sqlalchemy import select

from app.auth import current_user, login_required
from app.db import get_session
from app.errors import ApiError
from app.models import AiQuery
from app.routes._helpers import parse_body
from app.schemas.requests import AiWorkoutIn
from app.schemas.serializers import ai_query_to_dict, workout_to_dict
from app.services import ai as ai_service

bp = Blueprint("ai", __name__)


@bp.post("/workouts")
@login_required
def generate_workout():
    data = parse_body(AiWorkoutIn)
    workout = ai_service.generate_workout(
        get_session(),
        current_user(),
        data.request,
        model=current_app.config["GEMINI_MODEL"],
        api_key=current_app.config["GEMINI_API_KEY"],
        today=date.today(),
    )
    return jsonify(workout_to_dict(workout)), 201


@bp.get("/queries")
@login_required
def list_queries():
    query = (
        select(AiQuery)
        .where(AiQuery.user_id == current_user().id)
        .order_by(AiQuery.created_at.desc(), AiQuery.id.desc())
        .limit(50)
    )
    return jsonify([ai_query_to_dict(q) for q in get_session().scalars(query)])


@bp.get("/queries/<int:query_id>")
@login_required
def get_query(query_id: int):
    item = get_session().scalars(
        select(AiQuery).where(AiQuery.id == query_id, AiQuery.user_id == current_user().id)
    ).first()
    if item is None:
        raise ApiError(404, "not_found", "AI query not found.")
    return jsonify(ai_query_to_dict(item))

from flask import Blueprint, jsonify, request

from app.auth import current_user, login_required
from app.db import get_session
from app.routes._helpers import parse_body
from app.schemas.requests import ExerciseIn, ExerciseUpdateIn
from app.schemas.serializers import exercise_to_dict
from app.services import exercises as exercises_service

bp = Blueprint("exercises", __name__)


@bp.get("")
@login_required
def list_exercises():
    items = exercises_service.list_exercises(
        get_session(),
        current_user().id,
        category=request.args.get("category"),
        equipment=request.args.get("equipment"),
        search=request.args.get("q"),
    )
    return jsonify([exercise_to_dict(e) for e in items])


@bp.post("")
@login_required
def create_exercise():
    item = exercises_service.create_exercise(get_session(), current_user().id, parse_body(ExerciseIn))
    return jsonify(exercise_to_dict(item)), 201


@bp.get("/<int:exercise_id>")
@login_required
def get_exercise(exercise_id: int):
    item = exercises_service.get_visible_exercise(get_session(), current_user().id, exercise_id)
    return jsonify(exercise_to_dict(item))


@bp.patch("/<int:exercise_id>")
@login_required
def update_exercise(exercise_id: int):
    changes = parse_body(ExerciseUpdateIn).model_dump(exclude_unset=True)
    item = exercises_service.update_exercise(get_session(), current_user().id, exercise_id, changes)
    return jsonify(exercise_to_dict(item))


@bp.delete("/<int:exercise_id>")
@login_required
def delete_exercise(exercise_id: int):
    exercises_service.deactivate_exercise(get_session(), current_user().id, exercise_id)
    return "", 204

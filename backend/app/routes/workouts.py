from flask import Blueprint, jsonify, request

from app.auth import current_user, login_required
from app.db import get_session
from app.errors import ApiError
from app.models.enums import WORKOUT_STATUSES
from app.routes._helpers import parse_body
from app.schemas.requests import (
    ReorderIn,
    SetIn,
    SetUpdateIn,
    WorkoutExerciseIn,
    WorkoutExerciseUpdateIn,
    WorkoutIn,
    WorkoutUpdateIn,
)
from app.schemas.serializers import set_to_dict, workout_exercise_to_dict, workout_to_dict
from app.services import workouts as svc

bp = Blueprint("workouts", __name__)


def _uid() -> int:
    return current_user().id


@bp.get("")
@login_required
def list_workouts():
    status = request.args.get("status")
    if status is not None and status not in WORKOUT_STATUSES:
        raise ApiError(400, "validation_error", f"status must be one of: {', '.join(WORKOUT_STATUSES)}")
    limit = min(max(request.args.get("limit", 50, type=int), 1), 200)
    items = svc.list_workouts(get_session(), _uid(), status, limit)
    return jsonify([workout_to_dict(w, include_exercises=False) for w in items])


@bp.post("")
@login_required
def create_workout():
    workout = svc.create_workout(get_session(), _uid(), parse_body(WorkoutIn))
    return jsonify(workout_to_dict(workout)), 201


@bp.get("/<int:workout_id>")
@login_required
def get_workout(workout_id: int):
    return jsonify(workout_to_dict(svc.get_workout(get_session(), _uid(), workout_id)))


@bp.patch("/<int:workout_id>")
@login_required
def update_workout(workout_id: int):
    changes = parse_body(WorkoutUpdateIn).model_dump(exclude_unset=True)
    return jsonify(workout_to_dict(svc.update_workout(get_session(), _uid(), workout_id, changes)))


@bp.delete("/<int:workout_id>")
@login_required
def delete_workout(workout_id: int):
    svc.delete_workout(get_session(), _uid(), workout_id)
    return "", 204


@bp.post("/<int:workout_id>/start")
@login_required
def start_workout(workout_id: int):
    return jsonify(workout_to_dict(svc.start_workout(get_session(), _uid(), workout_id)))


@bp.post("/<int:workout_id>/finish")
@login_required
def finish_workout(workout_id: int):
    return jsonify(workout_to_dict(svc.finish_workout(get_session(), _uid(), workout_id)))


@bp.post("/<int:workout_id>/abandon")
@login_required
def abandon_workout(workout_id: int):
    return jsonify(workout_to_dict(svc.abandon_workout(get_session(), _uid(), workout_id)))


# --- exercises inside a workout ---


@bp.post("/<int:workout_id>/exercises")
@login_required
def add_exercise(workout_id: int):
    we = svc.add_exercise(get_session(), _uid(), workout_id, parse_body(WorkoutExerciseIn))
    return jsonify(workout_exercise_to_dict(we)), 201


@bp.patch("/<int:workout_id>/exercises/<int:workout_exercise_id>")
@login_required
def update_exercise(workout_id: int, workout_exercise_id: int):
    changes = parse_body(WorkoutExerciseUpdateIn).model_dump(exclude_unset=True)
    we = svc.update_exercise_notes(get_session(), _uid(), workout_id, workout_exercise_id, changes)
    return jsonify(workout_exercise_to_dict(we))


@bp.delete("/<int:workout_id>/exercises/<int:workout_exercise_id>")
@login_required
def remove_exercise(workout_id: int, workout_exercise_id: int):
    workout = svc.remove_exercise(get_session(), _uid(), workout_id, workout_exercise_id)
    return jsonify(workout_to_dict(workout))


@bp.put("/<int:workout_id>/exercises/order")
@login_required
def reorder_exercises(workout_id: int):
    data = parse_body(ReorderIn)
    workout = svc.reorder_exercises(get_session(), _uid(), workout_id, data.workout_exercise_ids)
    return jsonify(workout_to_dict(workout))


# --- sets ---


@bp.post("/<int:workout_id>/exercises/<int:workout_exercise_id>/sets")
@login_required
def add_set(workout_id: int, workout_exercise_id: int):
    item = svc.add_set(get_session(), _uid(), workout_id, workout_exercise_id, parse_body(SetIn))
    return jsonify(set_to_dict(item)), 201


@bp.patch("/<int:workout_id>/sets/<int:set_id>")
@login_required
def update_set(workout_id: int, set_id: int):
    changes = parse_body(SetUpdateIn).model_dump(exclude_unset=True)
    return jsonify(set_to_dict(svc.update_set(get_session(), _uid(), workout_id, set_id, changes)))


@bp.delete("/<int:workout_id>/sets/<int:set_id>")
@login_required
def delete_set(workout_id: int, set_id: int):
    svc.delete_set(get_session(), _uid(), workout_id, set_id)
    return "", 204

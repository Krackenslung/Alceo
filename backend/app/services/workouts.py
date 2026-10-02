from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.errors import ApiError
from app.models import Workout, WorkoutExercise, WorkoutSet
from app.schemas.requests import SetIn, WorkoutExerciseIn, WorkoutIn
from app.services.exercises import get_usable_exercise


def _now() -> datetime:
    return datetime.now(timezone.utc)


def list_workouts(session: Session, user_id: int, status: str | None = None, limit: int = 50) -> list[Workout]:
    query = select(Workout).where(Workout.user_id == user_id)
    if status:
        query = query.where(Workout.status == status)
    query = query.order_by(Workout.created_at.desc(), Workout.id.desc()).limit(limit)
    return list(session.scalars(query))


def get_workout(session: Session, user_id: int, workout_id: int) -> Workout:
    workout = session.scalars(select(Workout).where(Workout.id == workout_id, Workout.user_id == user_id)).first()
    if workout is None:
        raise ApiError(404, "not_found", "Workout not found.")
    return workout


def _ensure_editable(workout: Workout) -> None:
    if workout.status in ("completed", "abandoned"):
        raise ApiError(409, "workout_closed", f"A {workout.status} workout cannot be edited.")


def _build_set(number: int, data: SetIn) -> WorkoutSet:
    return WorkoutSet(set_number=number, **data.model_dump())


def _build_exercise(session: Session, user_id: int, sort_order: int, data: WorkoutExerciseIn) -> WorkoutExercise:
    exercise = get_usable_exercise(session, user_id, data.exercise_id)
    return WorkoutExercise(
        exercise=exercise,
        sort_order=sort_order,
        notes=data.notes,
        sets=[_build_set(i, s) for i, s in enumerate(data.sets, start=1)],
    )


def build_workout(
    session: Session, user_id: int, data: WorkoutIn, ai_query_id: int | None = None
) -> Workout:
    """Adds a planned workout to the session without committing."""
    workout = Workout(
        user_id=user_id,
        ai_query_id=ai_query_id,
        name=data.name,
        notes=data.notes,
        status="planned",
        exercises=[_build_exercise(session, user_id, i, ex) for i, ex in enumerate(data.exercises, start=1)],
    )
    session.add(workout)
    return workout


def create_workout(session: Session, user_id: int, data: WorkoutIn) -> Workout:
    workout = build_workout(session, user_id, data)
    session.commit()
    return workout


def update_workout(session: Session, user_id: int, workout_id: int, changes: dict[str, Any]) -> Workout:
    workout = get_workout(session, user_id, workout_id)
    for key, value in changes.items():
        setattr(workout, key, value)
    session.commit()
    return workout


def delete_workout(session: Session, user_id: int, workout_id: int) -> None:
    workout = get_workout(session, user_id, workout_id)
    if workout.status != "planned":
        raise ApiError(409, "workout_not_planned", "Only planned workouts can be deleted. Abandon it instead.")
    session.delete(workout)
    session.commit()


# --- status transitions ---


def start_workout(session: Session, user_id: int, workout_id: int) -> Workout:
    workout = get_workout(session, user_id, workout_id)
    if workout.status != "planned":
        raise ApiError(409, "invalid_transition", "Only a planned workout can be started.")
    workout.status = "in_progress"
    workout.started_at = _now()
    workout.finished_at = None
    session.commit()
    return workout


def finish_workout(session: Session, user_id: int, workout_id: int) -> Workout:
    workout = get_workout(session, user_id, workout_id)
    if workout.status != "in_progress":
        raise ApiError(409, "invalid_transition", "Only an in-progress workout can be finished.")
    workout.status = "completed"
    workout.finished_at = _now()
    session.commit()
    return workout


def abandon_workout(session: Session, user_id: int, workout_id: int) -> Workout:
    workout = get_workout(session, user_id, workout_id)
    if workout.status not in ("planned", "in_progress"):
        raise ApiError(409, "invalid_transition", "This workout is already closed.")
    workout.status = "abandoned"
    workout.finished_at = _now() if workout.started_at is not None else None
    session.commit()
    return workout


# --- exercises inside a workout ---


def _get_workout_exercise(workout: Workout, workout_exercise_id: int) -> WorkoutExercise:
    for we in workout.exercises:
        if we.id == workout_exercise_id:
            return we
    raise ApiError(404, "not_found", "Exercise not found in this workout.")


def _renumber_exercises(session: Session, items: list[WorkoutExercise]) -> None:
    # Two passes, because the UNIQUE(workout_id, sort_order) check runs row by row.
    for i, we in enumerate(items, start=1):
        we.sort_order = -i
    session.flush()
    for i, we in enumerate(items, start=1):
        we.sort_order = i
    session.flush()


def _renumber_sets(session: Session, items: list[WorkoutSet]) -> None:
    for i, s in enumerate(items, start=1):
        s.set_number = -i
    session.flush()
    for i, s in enumerate(items, start=1):
        s.set_number = i
    session.flush()


def add_exercise(session: Session, user_id: int, workout_id: int, data: WorkoutExerciseIn) -> WorkoutExercise:
    workout = get_workout(session, user_id, workout_id)
    _ensure_editable(workout)
    next_order = max((we.sort_order for we in workout.exercises), default=0) + 1
    we = _build_exercise(session, user_id, next_order, data)
    workout.exercises.append(we)
    session.commit()
    return we


def update_exercise_notes(
    session: Session, user_id: int, workout_id: int, workout_exercise_id: int, changes: dict[str, Any]
) -> WorkoutExercise:
    workout = get_workout(session, user_id, workout_id)
    we = _get_workout_exercise(workout, workout_exercise_id)
    for key, value in changes.items():
        setattr(we, key, value)
    session.commit()
    return we


def remove_exercise(session: Session, user_id: int, workout_id: int, workout_exercise_id: int) -> Workout:
    workout = get_workout(session, user_id, workout_id)
    _ensure_editable(workout)
    we = _get_workout_exercise(workout, workout_exercise_id)
    workout.exercises.remove(we)
    session.flush()
    _renumber_exercises(session, workout.exercises)
    session.commit()
    return workout


def reorder_exercises(session: Session, user_id: int, workout_id: int, ordered_ids: list[int]) -> Workout:
    workout = get_workout(session, user_id, workout_id)
    _ensure_editable(workout)
    current = {we.id: we for we in workout.exercises}
    if sorted(ordered_ids) != sorted(current):
        raise ApiError(400, "validation_error", "workout_exercise_ids must list every exercise of the workout once.")
    _renumber_exercises(session, [current[i] for i in ordered_ids])
    session.commit()
    session.refresh(workout)
    return workout


# --- sets ---


def _get_set(workout: Workout, set_id: int) -> tuple[WorkoutExercise, WorkoutSet]:
    for we in workout.exercises:
        for s in we.sets:
            if s.id == set_id:
                return we, s
    raise ApiError(404, "not_found", "Set not found in this workout.")


def add_set(session: Session, user_id: int, workout_id: int, workout_exercise_id: int, data: SetIn) -> WorkoutSet:
    workout = get_workout(session, user_id, workout_id)
    _ensure_editable(workout)
    we = _get_workout_exercise(workout, workout_exercise_id)
    new_set = _build_set(max((s.set_number for s in we.sets), default=0) + 1, data)
    we.sets.append(new_set)
    session.commit()
    return new_set


def update_set(session: Session, user_id: int, workout_id: int, set_id: int, changes: dict[str, Any]) -> WorkoutSet:
    workout = get_workout(session, user_id, workout_id)
    _ensure_editable(workout)
    _, item = _get_set(workout, set_id)
    for key, value in changes.items():
        setattr(item, key, value)
    session.commit()
    return item


def delete_set(session: Session, user_id: int, workout_id: int, set_id: int) -> None:
    workout = get_workout(session, user_id, workout_id)
    _ensure_editable(workout)
    we, item = _get_set(workout, set_id)
    we.sets.remove(item)
    session.flush()
    _renumber_sets(session, we.sets)
    session.commit()

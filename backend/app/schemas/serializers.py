from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any

from app.models import AiQuery, Exercise, User, UserFilter, Workout, WorkoutExercise, WorkoutSet


def iso(value: datetime | None) -> str | None:
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def iso_date(value: date | None) -> str | None:
    return value.isoformat() if value else None


def num(value: Decimal | None) -> float | None:
    return float(value) if value is not None else None


def user_to_dict(user: User) -> dict[str, Any]:
    # password_hash is never returned.
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "sex": user.sex,
        "date_of_birth": iso_date(user.date_of_birth),
        "height_cm": num(user.height_cm),
        "weight_kg": num(user.weight_kg),
        "body_fat_pct": num(user.body_fat_pct),
        "status": user.status,
        "has_password": user.password_hash is not None,
        "created_at": iso(user.created_at),
    }


def filter_to_dict(f: UserFilter) -> dict[str, Any]:
    return {
        "id": f.id,
        "filter_type": f.filter_type,
        "description": f.description,
        "priority": f.priority,
        "value_num": num(f.value_num),
        "unit": f.unit,
        "is_active": f.is_active,
        "created_at": iso(f.created_at),
    }


def exercise_to_dict(e: Exercise) -> dict[str, Any]:
    return {
        "id": e.id,
        "name": e.name,
        "description": e.description,
        "category": e.category,
        "primary_muscle": e.primary_muscle,
        "equipment": e.equipment,
        "created_by_user_id": e.created_by_user_id,
        "is_active": e.is_active,
        "created_at": iso(e.created_at),
    }


def set_to_dict(s: WorkoutSet) -> dict[str, Any]:
    return {
        "id": s.id,
        "set_number": s.set_number,
        "reps": s.reps,
        "weight_kg": num(s.weight_kg),
        "duration_seconds": s.duration_seconds,
        "distance_m": num(s.distance_m),
        "rpe": num(s.rpe),
        "is_warmup": s.is_warmup,
        "completed_at": iso(s.completed_at),
    }


def workout_exercise_to_dict(we: WorkoutExercise) -> dict[str, Any]:
    return {
        "id": we.id,
        "exercise_id": we.exercise_id,
        "exercise_name": we.exercise.name,
        "category": we.exercise.category,
        "equipment": we.exercise.equipment,
        "sort_order": we.sort_order,
        "notes": we.notes,
        "sets": [set_to_dict(s) for s in we.sets],
    }


def workout_to_dict(w: Workout, include_exercises: bool = True) -> dict[str, Any]:
    data: dict[str, Any] = {
        "id": w.id,
        "ai_query_id": w.ai_query_id,
        "name": w.name,
        "status": w.status,
        "started_at": iso(w.started_at),
        "finished_at": iso(w.finished_at),
        "notes": w.notes,
        "created_at": iso(w.created_at),
    }
    if include_exercises:
        data["exercises"] = [workout_exercise_to_dict(we) for we in w.exercises]
    return data


def ai_query_to_dict(q: AiQuery) -> dict[str, Any]:
    return {
        "id": q.id,
        "model": q.model,
        "status": q.status,
        "system_prompt": q.system_prompt,
        "user_prompt": q.user_prompt,
        "response": q.response,
        "error_message": q.error_message,
        "created_at": iso(q.created_at),
    }

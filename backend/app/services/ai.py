import json
import logging
from collections.abc import Callable
from datetime import date
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.errors import ApiError
from app.models import AiQuery, Exercise, User, UserFilter, Workout
from app.schemas.ai import AiResponseError, CatalogExercise, validate_ai_plan
from app.schemas.requests import SetIn, WorkoutExerciseIn, WorkoutIn
from app.services.exercises import visible_to
from app.services.prompts import build_system_prompt, build_user_prompt
from app.services.users import compute_age
from app.services.workouts import build_workout

logger = logging.getLogger(__name__)

# (system_prompt, user_prompt, model, api_key) -> raw text reply
ModelCaller = Callable[[str, str, str, str], str]

RECENT_WORKOUTS = 5


def call_gemini(system_prompt: str, user_prompt: str, model: str, api_key: str) -> str:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model=model,
        contents=[types.Content(role="user", parts=[types.Part(text=user_prompt)])],
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            response_mime_type="application/json",
        ),
    )
    if not response.text:
        raise AiResponseError("Gemini returned an empty reply.")
    return response.text


# --- data gathering (reads the DB, returns plain dicts for the pure prompt builder) ---


def _num(value: Any) -> float | None:
    return float(value) if value is not None else None


def profile_data(user: User, today: date) -> dict[str, Any]:
    return {
        "role": user.role,
        "sex": user.sex,
        "age": compute_age(user.date_of_birth, today) if user.date_of_birth else None,
        "height_cm": _num(user.height_cm),
        "weight_kg": _num(user.weight_kg),
        "body_fat_pct": _num(user.body_fat_pct),
    }


def active_filters(session: Session, user_id: int) -> list[UserFilter]:
    query = select(UserFilter).where(UserFilter.user_id == user_id, UserFilter.is_active.is_(True))
    return list(session.scalars(query.order_by(UserFilter.filter_type, UserFilter.priority, UserFilter.id)))


def filters_data(filters: list[UserFilter]) -> list[dict[str, Any]]:
    return [
        {
            "type": f.filter_type,
            "description": f.description,
            "priority": f.priority,
            "value": _num(f.value_num),
            "unit": f.unit,
        }
        for f in filters
    ]


def allowed_equipment(filters: list[UserFilter]) -> set[str] | None:
    """None means the user listed no equipment, so every equipment type is allowed."""
    words = {f.description for f in filters if f.filter_type == "equipment"}
    return words or None


def recent_workouts_data(session: Session, user_id: int) -> list[dict[str, Any]]:
    query = (
        select(Workout)
        .where(Workout.user_id == user_id, Workout.status == "completed")
        .order_by(Workout.finished_at.desc())
        .limit(RECENT_WORKOUTS)
    )
    result = []
    for w in session.scalars(query):
        result.append(
            {
                "name": w.name,
                "date": w.finished_at.date().isoformat() if w.finished_at else None,
                "exercises": [
                    {
                        "name": we.exercise.name,
                        "working_sets": [
                            {"reps": s.reps, "weight_kg": _num(s.weight_kg), "rpe": _num(s.rpe)}
                            for s in we.sets
                            if not s.is_warmup
                        ],
                    }
                    for we in w.exercises
                ],
            }
        )
    return result


def exercise_catalog(session: Session, user_id: int, equipment: set[str] | None) -> list[CatalogExercise]:
    query = select(Exercise).where(visible_to(user_id), Exercise.is_active.is_(True))
    if equipment is not None:
        query = query.where((Exercise.equipment.is_(None)) | (Exercise.equipment.in_(equipment)))
    return [
        CatalogExercise(e.id, e.name, e.category, e.equipment, e.primary_muscle)
        for e in session.scalars(query.order_by(Exercise.name))
    ]


def catalog_data(catalog: list[CatalogExercise]) -> list[dict[str, Any]]:
    return [
        {"name": c.name, "category": c.category, "equipment": c.equipment, "primary_muscle": c.primary_muscle}
        for c in catalog
    ]


# --- main flow ---


def generate_workout(
    session: Session,
    user: User,
    request_text: str,
    *,
    model: str,
    api_key: str,
    today: date,
    call_model: ModelCaller | None = None,
) -> Workout:
    call_model = call_model or call_gemini
    if not api_key:
        raise ApiError(503, "ai_not_configured", "GEMINI_API_KEY is not set on the server.")
    if user.status != "active":
        raise ApiError(403, "onboarding_required", "Finish onboarding before generating workouts.")

    filters = active_filters(session, user.id)
    equipment = allowed_equipment(filters)
    catalog = exercise_catalog(session, user.id, equipment)
    if not catalog:
        raise ApiError(409, "no_exercises", "No exercises match your equipment. Add exercises or equipment first.")

    query = AiQuery(
        user_id=user.id,
        system_prompt=build_system_prompt(),
        user_prompt=build_user_prompt(
            profile=profile_data(user, today),
            filters=filters_data(filters),
            recent_workouts=recent_workouts_data(session, user.id),
            available_exercises=catalog_data(catalog),
            request=request_text,
            today=today,
        ),
        model=model,
        status="pending",
    )
    session.add(query)
    session.commit()

    try:
        raw_text = call_model(query.system_prompt, query.user_prompt, model, api_key)
        try:
            raw = json.loads(raw_text)
        except json.JSONDecodeError as exc:
            raise AiResponseError("AI reply is not valid JSON.") from exc
        plan = validate_ai_plan(raw, catalog, equipment)

        query.response = raw
        query.status = "success"
        workout = build_workout(
            session,
            user.id,
            WorkoutIn(
                name=plan.name,
                notes=plan.notes,
                exercises=[
                    WorkoutExerciseIn(
                        exercise_id=ex.exercise_id,
                        notes=ex.notes,
                        sets=[SetIn(**s.model_dump()) for s in ex.sets],
                    )
                    for ex in plan.exercises
                ],
            ),
            ai_query_id=query.id,
        )
        session.commit()
        return workout
    except Exception as exc:
        session.rollback()
        logger.warning("AI query %s failed: %s", query.id, exc)
        message = str(exc) if isinstance(exc, (AiResponseError, ApiError)) else f"AI call failed: {type(exc).__name__}: {exc}"
        query.status = "error"
        query.error_message = message[:500]
        query.response = None
        session.commit()
        raise ApiError(502, "ai_failed", message[:500]) from exc

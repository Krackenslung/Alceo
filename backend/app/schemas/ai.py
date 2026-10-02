"""Shape of the JSON the AI must return, and validation against the exercise catalog."""

from dataclasses import dataclass, field
from decimal import Decimal
from typing import Annotated, Any

from pydantic import BaseModel, BeforeValidator, ConfigDict, Field, ValidationError

from app.models.enums import EQUIPMENT


def _truncate(limit: int):
    def inner(value: Any) -> Any:
        if isinstance(value, str):
            value = value.strip()
            return value[:limit] or None
        return value

    return BeforeValidator(inner)


class AiSet(BaseModel):
    model_config = ConfigDict(extra="ignore")

    reps: int | None = Field(default=None, ge=0, le=500)
    weight_kg: Decimal | None = Field(default=None, ge=0, le=9999.99)
    duration_seconds: int | None = Field(default=None, ge=0, le=86400)
    distance_m: Decimal | None = Field(default=None, ge=0, le=999999.99)
    rpe: Decimal | None = Field(default=None, ge=1, le=10)
    is_warmup: bool = False


class AiExercise(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str = Field(min_length=1)
    equipment: str | None = None
    notes: Annotated[str | None, _truncate(500)] = None
    sets: list[AiSet] = Field(min_length=1, max_length=20)


class AiWorkout(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: Annotated[str | None, _truncate(100)] = None
    notes: Annotated[str | None, _truncate(1000)] = None
    exercises: list[AiExercise] = Field(min_length=1, max_length=20)


@dataclass(frozen=True)
class CatalogExercise:
    id: int
    name: str
    category: str
    equipment: str | None
    primary_muscle: str | None


@dataclass
class PlannedExercise:
    exercise_id: int
    notes: str | None
    sets: list[AiSet]


@dataclass
class ValidatedPlan:
    name: str | None
    notes: str | None
    exercises: list[PlannedExercise] = field(default_factory=list)


class AiResponseError(ValueError):
    pass


def normalize_name(name: str) -> str:
    return " ".join(name.lower().replace("-", " ").split())


def _round(value: Decimal | None, places: int) -> Decimal | None:
    return round(value, places) if value is not None else None


def _round_set(s: AiSet) -> AiSet:
    return s.model_copy(
        update={
            "weight_kg": _round(s.weight_kg, 2),
            "distance_m": _round(s.distance_m, 2),
            "rpe": _round(s.rpe, 1),
        }
    )


def validate_ai_plan(
    raw: Any,
    catalog: list[CatalogExercise],
    allowed_equipment: set[str] | None,
) -> ValidatedPlan:
    """Check the AI reply. Exercise names are mapped onto the catalog; anything unknown is rejected."""
    try:
        workout = AiWorkout.model_validate(raw)
    except ValidationError as exc:
        raise AiResponseError(f"AI reply has the wrong shape: {exc.errors()[0]['msg']}") from exc

    by_name = {normalize_name(ex.name): ex for ex in catalog}
    plan = ValidatedPlan(name=workout.name, notes=workout.notes)
    for item in workout.exercises:
        match = by_name.get(normalize_name(item.name))
        if match is None:
            raise AiResponseError(f"AI suggested an unknown exercise: {item.name[:100]}")
        if item.equipment is not None and item.equipment.lower() not in EQUIPMENT:
            raise AiResponseError(f"AI suggested equipment outside the allowed list: {item.equipment[:50]}")
        if allowed_equipment is not None and match.equipment is not None and match.equipment not in allowed_equipment:
            raise AiResponseError(f"AI suggested {match.name}, which needs equipment the user does not have")
        sets = [_round_set(s) for s in item.sets]
        plan.exercises.append(PlannedExercise(exercise_id=match.id, notes=item.notes, sets=sets))
    return plan

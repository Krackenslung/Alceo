from datetime import date, datetime
from decimal import Decimal
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator

from app.models.enums import EQUIPMENT, EXERCISE_CATEGORIES, FILTER_TYPES, SEXES

Email = Annotated[
    str,
    StringConstraints(strip_whitespace=True, to_lower=True, max_length=255, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$"),
]
Sex = Literal[SEXES]  # type: ignore[valid-type]
FilterType = Literal[FILTER_TYPES]  # type: ignore[valid-type]
Category = Literal[EXERCISE_CATEGORIES]  # type: ignore[valid-type]
Equipment = Literal[EQUIPMENT]  # type: ignore[valid-type]
Rpe = Annotated[Decimal, Field(ge=1, le=10, decimal_places=1)]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


# --- auth / users ---


class RegisterIn(StrictModel):
    name: str = Field(min_length=1, max_length=100)
    email: Email
    password: str = Field(min_length=8, max_length=128)


class LoginIn(StrictModel):
    email: Email
    password: str = Field(min_length=1, max_length=128)


class GoogleLoginIn(StrictModel):
    id_token: str = Field(min_length=1)


class ProfileUpdateIn(StrictModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    sex: Sex | None = None
    date_of_birth: date | None = None
    height_cm: Decimal | None = Field(default=None, gt=0, le=300, decimal_places=1)
    weight_kg: Decimal | None = Field(default=None, gt=0, le=999.99, decimal_places=2)
    body_fat_pct: Decimal | None = Field(default=None, ge=0, le=100, decimal_places=1)


# --- filters ---


def check_equipment_word(filter_type: str | None, description: str | None) -> None:
    if filter_type == "equipment" and description is not None and description not in EQUIPMENT:
        raise ValueError(f"equipment filters must use one of: {', '.join(EQUIPMENT)}")


class FilterIn(StrictModel):
    filter_type: FilterType
    description: str = Field(min_length=1, max_length=255)
    priority: int | None = Field(default=None, ge=0, le=32767)
    value_num: Decimal | None = Field(default=None, max_digits=8, decimal_places=2)
    unit: str | None = Field(default=None, max_length=10)

    @model_validator(mode="after")
    def _equipment_vocabulary(self) -> "FilterIn":
        if self.filter_type == "equipment":
            self.description = self.description.lower()
        check_equipment_word(self.filter_type, self.description)
        return self


class FilterUpdateIn(StrictModel):
    description: str | None = Field(default=None, min_length=1, max_length=255)
    priority: int | None = Field(default=None, ge=0, le=32767)
    value_num: Decimal | None = Field(default=None, max_digits=8, decimal_places=2)
    unit: str | None = Field(default=None, max_length=10)
    is_active: bool | None = None


# --- exercises ---


class ExerciseIn(StrictModel):
    name: str = Field(min_length=1, max_length=150)
    description: str | None = Field(default=None, max_length=1000)
    category: Category
    primary_muscle: str | None = Field(default=None, max_length=30)
    equipment: Equipment | None = None


class ExerciseUpdateIn(StrictModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    description: str | None = Field(default=None, max_length=1000)
    category: Category | None = None
    primary_muscle: str | None = Field(default=None, max_length=30)
    equipment: Equipment | None = None


# --- workouts ---


class SetIn(StrictModel):
    reps: int | None = Field(default=None, ge=0, le=32767)
    weight_kg: Decimal | None = Field(default=None, ge=0, le=9999.99, decimal_places=2)
    duration_seconds: int | None = Field(default=None, ge=0)
    distance_m: Decimal | None = Field(default=None, ge=0, le=999999.99, decimal_places=2)
    rpe: Rpe | None = None
    is_warmup: bool = False
    completed_at: datetime | None = None


class SetUpdateIn(StrictModel):
    reps: int | None = Field(default=None, ge=0, le=32767)
    weight_kg: Decimal | None = Field(default=None, ge=0, le=9999.99, decimal_places=2)
    duration_seconds: int | None = Field(default=None, ge=0)
    distance_m: Decimal | None = Field(default=None, ge=0, le=999999.99, decimal_places=2)
    rpe: Rpe | None = None
    is_warmup: bool | None = None
    completed_at: datetime | None = None


class WorkoutExerciseIn(StrictModel):
    exercise_id: int
    notes: str | None = Field(default=None, max_length=500)
    sets: list[SetIn] = Field(default_factory=list, max_length=50)


class WorkoutIn(StrictModel):
    name: str | None = Field(default=None, max_length=100)
    notes: str | None = Field(default=None, max_length=1000)
    exercises: list[WorkoutExerciseIn] = Field(default_factory=list, max_length=50)


class WorkoutUpdateIn(StrictModel):
    name: str | None = Field(default=None, max_length=100)
    notes: str | None = Field(default=None, max_length=1000)


class WorkoutExerciseUpdateIn(StrictModel):
    notes: str | None = Field(default=None, max_length=500)


class ReorderIn(StrictModel):
    workout_exercise_ids: list[int] = Field(min_length=1)


# --- ai ---


class AiWorkoutIn(StrictModel):
    request: str = Field(default="", max_length=1000)

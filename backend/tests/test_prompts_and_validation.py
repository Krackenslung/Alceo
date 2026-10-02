import json
from datetime import date

import pytest

from app.models.enums import EQUIPMENT
from app.schemas.ai import AiResponseError, CatalogExercise, validate_ai_plan
from app.services.prompts import build_system_prompt, build_user_prompt
from app.services.users import compute_age, passes_age_gate

CATALOG = [
    CatalogExercise(1, "Back Squat", "strength", "barbell", "quadriceps"),
    CatalogExercise(2, "Push-Up", "strength", "bodyweight", "chest"),
    CatalogExercise(3, "Running", "cardio", None, "full body"),
]


def _plan(*names: str, equipment: str | None = None) -> dict:
    return {
        "name": "Day 1",
        "notes": None,
        "exercises": [
            {"name": n, "equipment": equipment, "sets": [{"reps": 5, "weight_kg": 60, "rpe": 7, "is_warmup": False}]}
            for n in names
        ],
    }


def test_system_prompt_lists_rules_and_equipment() -> None:
    prompt = build_system_prompt()
    assert "injur" in prompt.lower()
    assert "is_warmup" in prompt
    assert "JSON" in prompt
    for word in EQUIPMENT:
        assert word in prompt


def test_user_prompt_is_deterministic_json_payload() -> None:
    args = dict(
        profile={"age": 30},
        filters=[{"type": "injury", "description": "left knee"}],
        recent_workouts=[],
        available_exercises=[{"name": "Back Squat"}],
        request="  legs please ",
        today=date(2026, 10, 2),
    )
    prompt = build_user_prompt(**args)
    assert prompt == build_user_prompt(**args)
    payload = json.loads(prompt.split("\n\n", 1)[1])
    assert payload["request"] == "legs please"
    assert payload["today"] == "2026-10-02"
    assert payload["filters"][0]["description"] == "left knee"


def test_user_prompt_default_request() -> None:
    prompt = build_user_prompt({}, [], [], [], "", date(2026, 1, 1))
    assert "Generate my next workout." in prompt


def test_validate_maps_names_case_and_dash_insensitively() -> None:
    plan = validate_ai_plan(_plan("back squat", "PUSH UP"), CATALOG, None)
    assert [e.exercise_id for e in plan.exercises] == [1, 2]


def test_validate_rejects_unknown_exercise() -> None:
    with pytest.raises(AiResponseError, match="unknown exercise"):
        validate_ai_plan(_plan("Bulgarian Split Squat"), CATALOG, None)


def test_validate_rejects_equipment_word_outside_vocabulary() -> None:
    with pytest.raises(AiResponseError, match="equipment"):
        validate_ai_plan(_plan("Back Squat", equipment="smith machine"), CATALOG, None)


def test_validate_rejects_equipment_user_does_not_have() -> None:
    with pytest.raises(AiResponseError, match="equipment"):
        validate_ai_plan(_plan("Back Squat"), CATALOG, {"bodyweight"})


def test_validate_allows_exercise_without_equipment() -> None:
    plan = validate_ai_plan(_plan("Running"), CATALOG, {"bodyweight"})
    assert plan.exercises[0].exercise_id == 3


def test_validate_rejects_bad_rpe_and_empty_plan() -> None:
    bad = _plan("Back Squat")
    bad["exercises"][0]["sets"][0]["rpe"] = 11
    with pytest.raises(AiResponseError):
        validate_ai_plan(bad, CATALOG, None)
    with pytest.raises(AiResponseError):
        validate_ai_plan({"name": "x", "exercises": []}, CATALOG, None)


def test_validate_rounds_numbers_to_column_precision() -> None:
    raw = _plan("Back Squat")
    raw["exercises"][0]["sets"][0].update({"weight_kg": 61.256, "rpe": 7.25})
    s = validate_ai_plan(raw, CATALOG, None).exercises[0].sets[0]
    assert str(s.weight_kg) == "61.26"
    assert str(s.rpe) == "7.2"


def test_age_gate() -> None:
    today = date(2026, 10, 2)
    assert compute_age(date(2010, 10, 3), today) == 15
    assert compute_age(date(2010, 10, 2), today) == 16
    assert not passes_age_gate(date(2010, 10, 3), today, 16)
    assert passes_age_gate(date(2010, 10, 2), today, 16)

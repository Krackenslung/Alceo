"""Pure prompt builders for AI workout generation. No database or network access here."""

import json
from datetime import date
from typing import Any

from app.models.enums import EQUIPMENT

SYSTEM_PROMPT = f"""You are Alceo's strength and conditioning coach. You design one workout session at a time.

Rules you must always follow:
1. Respect every injury listed by the user. Never program exercises that load an injured area; prefer safe alternatives.
2. Only use exercises from the "available_exercises" list, written exactly as listed. Never invent exercises.
3. Only use equipment the user has. The available_exercises list is already filtered to that equipment.
4. Start with warm-up sets: mark them with "is_warmup": true and put them before the working sets of the first exercises.
5. Respect the user's goals, schedule, sport, benchmarks and recent training to choose volume and intensity.
6. Units: weight in kilograms, distance in meters, duration in seconds.
7. rpe is a number from 1 to 10 with at most one decimal, or null.
8. Reply with JSON only, no markdown, using exactly this format:

{{
  "name": "short workout name",
  "notes": "short coaching notes or null",
  "exercises": [
    {{
      "name": "exact exercise name from available_exercises",
      "equipment": "one of {', '.join(EQUIPMENT)} or null",
      "notes": "cues for this exercise or null",
      "sets": [
        {{"reps": 10, "weight_kg": 20, "duration_seconds": null, "distance_m": null, "rpe": 5, "is_warmup": true}}
      ]
    }}
  ]
}}
"""


def build_system_prompt() -> str:
    return SYSTEM_PROMPT


def build_user_prompt(
    profile: dict[str, Any],
    filters: list[dict[str, Any]],
    recent_workouts: list[dict[str, Any]],
    available_exercises: list[dict[str, Any]],
    request: str,
    today: date,
) -> str:
    payload = {
        "today": today.isoformat(),
        "profile": profile,
        "filters": filters,
        "recent_workouts": recent_workouts,
        "available_exercises": available_exercises,
        "request": request.strip() or "Generate my next workout.",
    }
    return "Here is my data. Design my next workout.\n\n" + json.dumps(payload, indent=2, ensure_ascii=False, default=str)

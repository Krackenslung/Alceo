"""Single source for CHECK-constraint values. Must match alceo_1_1_schema.sql exactly."""

ROLES = ("athlete", "trainer")
SEXES = ("male", "female", "other")
USER_STATUSES = ("onboarding", "active", "blocked", "deleted")
FILTER_TYPES = (
    "injury",
    "weight_goal",
    "venue",
    "training_component",
    "schedule",
    "sport",
    "benchmark",
    "equipment",
)
EXERCISE_CATEGORIES = ("strength", "cardio", "mobility")
EQUIPMENT = ("barbell", "dumbbell", "kettlebell", "machine", "cable", "band", "bodyweight", "other")
WORKOUT_STATUSES = ("planned", "in_progress", "completed", "abandoned")
AI_QUERY_STATUSES = ("pending", "success", "error")


def in_list(column: str, values: tuple[str, ...]) -> str:
    quoted = ",".join(f"'{v}'" for v in values)
    return f"{column} IN ({quoted})"

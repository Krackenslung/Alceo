import click
from flask import Flask
from sqlalchemy import select

from app.db import SessionLocal
from app.models import Exercise

# (name, category, primary_muscle, equipment)
BUILT_IN_EXERCISES: list[tuple[str, str, str | None, str | None]] = [
    ("Back Squat", "strength", "quadriceps", "barbell"),
    ("Front Squat", "strength", "quadriceps", "barbell"),
    ("Deadlift", "strength", "hamstrings", "barbell"),
    ("Romanian Deadlift", "strength", "hamstrings", "barbell"),
    ("Bench Press", "strength", "chest", "barbell"),
    ("Overhead Press", "strength", "shoulders", "barbell"),
    ("Barbell Row", "strength", "back", "barbell"),
    ("Hip Thrust", "strength", "glutes", "barbell"),
    ("Dumbbell Bench Press", "strength", "chest", "dumbbell"),
    ("Dumbbell Shoulder Press", "strength", "shoulders", "dumbbell"),
    ("Dumbbell Row", "strength", "back", "dumbbell"),
    ("Goblet Squat", "strength", "quadriceps", "dumbbell"),
    ("Dumbbell Lunge", "strength", "quadriceps", "dumbbell"),
    ("Dumbbell Curl", "strength", "biceps", "dumbbell"),
    ("Lateral Raise", "strength", "shoulders", "dumbbell"),
    ("Kettlebell Swing", "strength", "glutes", "kettlebell"),
    ("Kettlebell Goblet Squat", "strength", "quadriceps", "kettlebell"),
    ("Leg Press", "strength", "quadriceps", "machine"),
    ("Leg Curl", "strength", "hamstrings", "machine"),
    ("Leg Extension", "strength", "quadriceps", "machine"),
    ("Chest Press Machine", "strength", "chest", "machine"),
    ("Lat Pulldown", "strength", "back", "cable"),
    ("Seated Cable Row", "strength", "back", "cable"),
    ("Cable Triceps Pushdown", "strength", "triceps", "cable"),
    ("Face Pull", "strength", "shoulders", "cable"),
    ("Band Pull-Apart", "mobility", "shoulders", "band"),
    ("Banded Glute Bridge", "strength", "glutes", "band"),
    ("Push-Up", "strength", "chest", "bodyweight"),
    ("Pull-Up", "strength", "back", "bodyweight"),
    ("Dip", "strength", "triceps", "bodyweight"),
    ("Bodyweight Squat", "strength", "quadriceps", "bodyweight"),
    ("Plank", "strength", "core", "bodyweight"),
    ("Walking Lunge", "strength", "quadriceps", "bodyweight"),
    ("Burpee", "cardio", "full body", "bodyweight"),
    ("Running", "cardio", "full body", None),
    ("Rowing Machine", "cardio", "full body", "machine"),
    ("Stationary Bike", "cardio", "quadriceps", "machine"),
    ("Jump Rope", "cardio", "calves", "other"),
    ("Hip Flexor Stretch", "mobility", "hip flexors", "bodyweight"),
    ("World's Greatest Stretch", "mobility", "full body", "bodyweight"),
    ("Cat-Cow", "mobility", "spine", "bodyweight"),
    ("Thoracic Rotation", "mobility", "spine", "bodyweight"),
]


def register_cli(app: Flask) -> None:
    @app.cli.command("seed-exercises")
    def seed_exercises() -> None:
        """Insert the built-in exercise catalog (skips names that already exist)."""
        with SessionLocal() as session:
            existing = {n.lower() for n in session.scalars(select(Exercise.name))}
            added = 0
            for name, category, muscle, equipment in BUILT_IN_EXERCISES:
                if name.lower() in existing:
                    continue
                session.add(Exercise(name=name, category=category, primary_muscle=muscle, equipment=equipment))
                added += 1
            session.commit()
        click.echo(f"Added {added} built-in exercises.")

"""Alceo 1.1 schema (mirrors alceo_1_1_schema.sql, without its DROP of the old tables)

Revision ID: 0001
Revises:
Create Date: 2026-10-02
"""
from typing import Sequence, Union

from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

STATEMENTS = [
    """
    CREATE TABLE users (
      id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NULL,
      role VARCHAR(10) NOT NULL DEFAULT 'athlete' CHECK (role IN ('athlete','trainer')),
      sex VARCHAR(10) NULL CHECK (sex IN ('male','female','other')),
      date_of_birth DATE NULL,
      height_cm NUMERIC(5,1) NULL,
      weight_kg NUMERIC(5,2) NULL,
      body_fat_pct NUMERIC(4,1) NULL,
      status VARCHAR(12) NOT NULL DEFAULT 'onboarding'
        CHECK (status IN ('onboarding','active','blocked','deleted')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
    """,
    """
    CREATE TABLE user_filters (
      id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      filter_type VARCHAR(20) NOT NULL CHECK (filter_type IN
        ('injury','weight_goal','venue','training_component','schedule','sport','benchmark','equipment')),
      description VARCHAR(255) NOT NULL,
      priority SMALLINT NULL,
      value_num NUMERIC(8,2) NULL,
      unit VARCHAR(10) NULL,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
    """,
    "CREATE INDEX idx_user_filters_user_id ON user_filters(user_id)",
    """
    CREATE TABLE exercises (
      id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      name VARCHAR(150) NOT NULL UNIQUE,
      description VARCHAR(1000) NULL,
      category VARCHAR(12) NOT NULL CHECK (category IN ('strength','cardio','mobility')),
      primary_muscle VARCHAR(30) NULL,
      equipment VARCHAR(30) NULL CHECK (equipment IN
        ('barbell','dumbbell','kettlebell','machine','cable','band','bodyweight','other')),
      created_by_user_id INT NULL REFERENCES users(id),
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
    """,
    """
    CREATE TABLE ai_queries (
      id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      system_prompt TEXT NOT NULL,
      user_prompt TEXT NOT NULL,
      response JSONB NULL,
      model VARCHAR(50) NOT NULL,
      status VARCHAR(10) NOT NULL CHECK (status IN ('pending','success','error')),
      error_message VARCHAR(500) NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
    """,
    "CREATE INDEX idx_ai_queries_user_id ON ai_queries(user_id)",
    """
    CREATE TABLE workouts (
      id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id),
      ai_query_id INT NULL REFERENCES ai_queries(id),
      name VARCHAR(100) NULL,
      started_at TIMESTAMPTZ NULL,
      finished_at TIMESTAMPTZ NULL,
      notes VARCHAR(1000) NULL,
      status VARCHAR(12) NOT NULL CHECK (status IN ('planned','in_progress','completed','abandoned')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT workouts_finished_after_started CHECK (finished_at >= started_at)
    )
    """,
    "CREATE INDEX idx_workouts_user_id ON workouts(user_id)",
    """
    CREATE TABLE workout_exercises (
      id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      workout_id INT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
      exercise_id INT NOT NULL REFERENCES exercises(id),
      sort_order SMALLINT NOT NULL,
      notes VARCHAR(500) NULL,
      UNIQUE (workout_id, sort_order)
    )
    """,
    """
    CREATE TABLE workout_sets (
      id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      workout_exercise_id INT NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
      set_number SMALLINT NOT NULL,
      reps SMALLINT NULL,
      weight_kg NUMERIC(6,2) NULL,
      duration_seconds INT NULL,
      distance_m NUMERIC(8,2) NULL,
      rpe NUMERIC(3,1) NULL CHECK (rpe BETWEEN 1 AND 10),
      is_warmup BOOLEAN NOT NULL DEFAULT false,
      completed_at TIMESTAMPTZ NULL,
      UNIQUE (workout_exercise_id, set_number)
    )
    """,
]


def upgrade() -> None:
    for statement in STATEMENTS:
        op.execute(statement)


def downgrade() -> None:
    op.execute(
        "DROP TABLE IF EXISTS workout_sets, workout_exercises, workouts, ai_queries, exercises, user_filters, users"
    )

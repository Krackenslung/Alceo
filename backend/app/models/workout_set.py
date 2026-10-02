from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Identity,
    Integer,
    Numeric,
    SmallInteger,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class WorkoutSet(Base):
    __tablename__ = "workout_sets"
    __table_args__ = (
        CheckConstraint("rpe BETWEEN 1 AND 10", name="workout_sets_rpe_check"),
        UniqueConstraint(
            "workout_exercise_id", "set_number", name="workout_sets_workout_exercise_id_set_number_key"
        ),
    )

    id: Mapped[int] = mapped_column(Identity(always=True), primary_key=True)
    workout_exercise_id: Mapped[int] = mapped_column(ForeignKey("workout_exercises.id", ondelete="CASCADE"))
    set_number: Mapped[int] = mapped_column(SmallInteger)
    reps: Mapped[int | None] = mapped_column(SmallInteger)
    weight_kg: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    duration_seconds: Mapped[int | None] = mapped_column(Integer)
    distance_m: Mapped[Decimal | None] = mapped_column(Numeric(8, 2))
    rpe: Mapped[Decimal | None] = mapped_column(Numeric(3, 1))
    is_warmup: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

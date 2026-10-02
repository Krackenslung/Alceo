from sqlalchemy import ForeignKey, Identity, SmallInteger, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.exercise import Exercise
from app.models.workout_set import WorkoutSet


class WorkoutExercise(Base):
    __tablename__ = "workout_exercises"
    __table_args__ = (
        UniqueConstraint("workout_id", "sort_order", name="workout_exercises_workout_id_sort_order_key"),
    )

    id: Mapped[int] = mapped_column(Identity(always=True), primary_key=True)
    workout_id: Mapped[int] = mapped_column(ForeignKey("workouts.id", ondelete="CASCADE"))
    # No cascade on purpose: protects workout history.
    exercise_id: Mapped[int] = mapped_column(ForeignKey("exercises.id"))
    sort_order: Mapped[int] = mapped_column(SmallInteger)
    notes: Mapped[str | None] = mapped_column(String(500))

    exercise: Mapped[Exercise] = relationship(lazy="joined")
    sets: Mapped[list[WorkoutSet]] = relationship(
        order_by=WorkoutSet.set_number,
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

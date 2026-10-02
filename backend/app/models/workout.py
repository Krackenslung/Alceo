from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Identity, Index, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.enums import WORKOUT_STATUSES, in_list
from app.models.workout_exercise import WorkoutExercise


class Workout(Base):
    __tablename__ = "workouts"
    __table_args__ = (
        CheckConstraint(in_list("status", WORKOUT_STATUSES), name="workouts_status_check"),
        CheckConstraint("finished_at >= started_at", name="workouts_finished_after_started"),
        Index("idx_workouts_user_id", "user_id"),
    )

    id: Mapped[int] = mapped_column(Identity(always=True), primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    # NULL = the user built it
    ai_query_id: Mapped[int | None] = mapped_column(ForeignKey("ai_queries.id"))
    name: Mapped[str | None] = mapped_column(String(100))
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    notes: Mapped[str | None] = mapped_column(String(1000))
    status: Mapped[str] = mapped_column(String(12))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    exercises: Mapped[list[WorkoutExercise]] = relationship(
        order_by=WorkoutExercise.sort_order,
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

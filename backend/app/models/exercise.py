from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Identity, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.models.enums import EQUIPMENT, EXERCISE_CATEGORIES, in_list


class Exercise(Base):
    __tablename__ = "exercises"
    __table_args__ = (
        CheckConstraint(in_list("category", EXERCISE_CATEGORIES), name="exercises_category_check"),
        CheckConstraint(in_list("equipment", EQUIPMENT), name="exercises_equipment_check"),
    )

    id: Mapped[int] = mapped_column(Identity(always=True), primary_key=True)
    name: Mapped[str] = mapped_column(String(150), unique=True)
    description: Mapped[str | None] = mapped_column(String(1000))
    category: Mapped[str] = mapped_column(String(12))
    primary_muscle: Mapped[str | None] = mapped_column(String(30))
    equipment: Mapped[str | None] = mapped_column(String(30))
    # NULL = built-in exercise
    created_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import CheckConstraint, Date, DateTime, Identity, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.models.enums import ROLES, SEXES, USER_STATUSES, in_list


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint(in_list("role", ROLES), name="users_role_check"),
        CheckConstraint(in_list("sex", SEXES), name="users_sex_check"),
        CheckConstraint(in_list("status", USER_STATUSES), name="users_status_check"),
    )

    id: Mapped[int] = mapped_column(Identity(always=True), primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255), unique=True)
    password_hash: Mapped[str | None] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(10), default="athlete", server_default="athlete")
    sex: Mapped[str | None] = mapped_column(String(10))
    date_of_birth: Mapped[date | None] = mapped_column(Date)
    height_cm: Mapped[Decimal | None] = mapped_column(Numeric(5, 1))
    weight_kg: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    body_fat_pct: Mapped[Decimal | None] = mapped_column(Numeric(4, 1))
    status: Mapped[str] = mapped_column(String(12), default="onboarding", server_default="onboarding")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

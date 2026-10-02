from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Identity,
    Index,
    Numeric,
    SmallInteger,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.models.enums import FILTER_TYPES, in_list


class UserFilter(Base):
    __tablename__ = "user_filters"
    __table_args__ = (
        CheckConstraint(in_list("filter_type", FILTER_TYPES), name="user_filters_filter_type_check"),
        Index("idx_user_filters_user_id", "user_id"),
    )

    id: Mapped[int] = mapped_column(Identity(always=True), primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    filter_type: Mapped[str] = mapped_column(String(20))
    description: Mapped[str] = mapped_column(String(255))
    priority: Mapped[int | None] = mapped_column(SmallInteger)
    value_num: Mapped[Decimal | None] = mapped_column(Numeric(8, 2))
    unit: Mapped[str | None] = mapped_column(String(10))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

from datetime import datetime
from typing import Any

from sqlalchemy import JSON, CheckConstraint, DateTime, ForeignKey, Identity, Index, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.models.enums import AI_QUERY_STATUSES, in_list


class AiQuery(Base):
    __tablename__ = "ai_queries"
    __table_args__ = (
        CheckConstraint(in_list("status", AI_QUERY_STATUSES), name="ai_queries_status_check"),
        Index("idx_ai_queries_user_id", "user_id"),
    )

    id: Mapped[int] = mapped_column(Identity(always=True), primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    system_prompt: Mapped[str] = mapped_column(Text)
    user_prompt: Mapped[str] = mapped_column(Text)
    response: Mapped[Any | None] = mapped_column(JSON().with_variant(JSONB(), "postgresql"))
    model: Mapped[str] = mapped_column(String(50))
    status: Mapped[str] = mapped_column(String(10))
    error_message: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

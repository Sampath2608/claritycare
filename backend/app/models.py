from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base

def utcnow():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    predictions: Mapped[list["Prediction"]] = relationship(back_populates="user", cascade="all, delete-orphan")

class Prediction(Base):
    __tablename__ = "predictions"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    symptoms: Mapped[list] = mapped_column(JSON)
    matches: Mapped[list] = mapped_column(JSON)
    urgent: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    user: Mapped[User] = relationship(back_populates="predictions")

class Condition(Base):
    __tablename__ = "conditions"
    slug: Mapped[str] = mapped_column(String(100), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    summary: Mapped[str] = mapped_column(Text)
    common_symptoms: Mapped[list] = mapped_column(JSON)
    prevention: Mapped[str] = mapped_column(Text)
    when_to_seek_care: Mapped[str] = mapped_column(Text)

from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
import os
import re
from typing import Annotated
from fastapi import Depends, FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from .content import CONDITIONS, SYMPTOM_GROUPS, SYMPTOMS, health_answer
from .database import Base, engine, get_db, SessionLocal
from .ml import predict as model_predict
from .models import Condition, Prediction, User
from .report import make_pdf
from .security import admin_user, create_token, current_user, hash_password, verify_password

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        for data in CONDITIONS:
            if not db.get(Condition, data["slug"]):
                db.add(Condition(**data))
        db.commit()
    yield

app = FastAPI(title="ClarityCare AI - Educational Health API", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if origin.strip()],
    allow_credentials=False, allow_methods=["GET", "POST", "PUT", "DELETE"], allow_headers=["Authorization", "Content-Type"])

Db = Annotated[Session, Depends(get_db)]
Me = Annotated[User, Depends(current_user)]
Admin = Annotated[User, Depends(admin_user)]

class AuthInput(BaseModel):
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=8, max_length=128)
    @field_validator("email")
    @classmethod
    def check_email(cls, value):
        value = value.strip().lower()
        if not re.fullmatch(r"[A-Z0-9a-z._%+\-]+@[A-Z0-9a-z.\-]+\.[A-Za-z]{2,}", value):
            raise ValueError("Enter a valid email address")
        return value

class RegisterInput(AuthInput):
    name: str = Field(min_length=2, max_length=100)

class ProfileInput(BaseModel):
    name: str = Field(min_length=2, max_length=100)

class PredictInput(BaseModel):
    symptoms: list[str] = Field(min_length=1, max_length=12)
    @field_validator("symptoms")
    @classmethod
    def check_symptoms(cls, values):
        if len(values) != len(set(values)) or any(item not in SYMPTOMS for item in values):
            raise ValueError("Select unique symptoms from the provided list")
        return values

class AssistantInput(BaseModel):
    message: str = Field(min_length=3, max_length=1000)

class ConditionInput(BaseModel):
    name: str = Field(min_length=3, max_length=100)
    summary: str = Field(min_length=10, max_length=4000)
    common_symptoms: list[str] = Field(max_length=25)
    prevention: str = Field(min_length=8, max_length=4000)
    when_to_seek_care: str = Field(min_length=8, max_length=4000)

def user_json(user: User):
    return {"id": user.id, "name": user.name, "email": user.email, "is_admin": user.is_admin, "created_at": user.created_at}

def condition_json(condition: Condition):
    return {"slug": condition.slug, "name": condition.name, "summary": condition.summary, "common_symptoms": condition.common_symptoms, "prevention": condition.prevention, "when_to_seek_care": condition.when_to_seek_care}

def prediction_json(record: Prediction):
    return {"id": record.id, "symptoms": record.symptoms, "urgent": record.urgent, "matches": record.matches, "created_at": record.created_at}

@app.get("/api/health")
def health():
    return {"status": "ok", "disclaimer": "Educational demo, not a medical device"}

@app.post("/api/auth/register", status_code=201)
def register(payload: RegisterInput, db: Db):
    if db.scalar(select(User).where(User.email == payload.email)):
        raise HTTPException(409, "Email is already registered")
    user = User(name=payload.name.strip(), email=payload.email, password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"token": create_token(user.id), "user": user_json(user)}

@app.post("/api/auth/login")
def login(payload: AuthInput, db: Db):
    user = db.scalar(select(User).where(User.email == payload.email))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(401, "Incorrect email or password")
    return {"token": create_token(user.id), "user": user_json(user)}

@app.get("/api/user/profile")
def get_profile(user: Me):
    return user_json(user)

@app.put("/api/user/profile")
def update_profile(payload: ProfileInput, db: Db, user: Me):
    user.name = payload.name.strip()
    db.commit()
    return user_json(user)

@app.delete("/api/user/profile", status_code=204)
def delete_profile(db: Db, user: Me):
    db.delete(user)
    db.commit()
    return Response(status_code=204)

@app.get("/api/symptoms")
def symptoms():
    return [{"group": group, "items": [{"id": key, "label": label} for key, label in items]} for group, items in SYMPTOM_GROUPS.items()]

@app.get("/api/conditions")
def list_conditions(db: Db):
    return [condition_json(condition) for condition in db.scalars(select(Condition).order_by(Condition.name)).all()]

@app.get("/api/conditions/{slug}")
def get_condition(slug: str, db: Db):
    condition = db.get(Condition, slug)
    if not condition:
        raise HTTPException(404, "Condition not found")
    return condition_json(condition)

@app.post("/api/predict", status_code=201)
def predict(payload: PredictInput, db: Db, user: Me):
    try:
        result = model_predict(payload.symptoms)
    except RuntimeError as exc:
        raise HTTPException(503, str(exc)) from exc
    record = Prediction(user_id=user.id, symptoms=payload.symptoms, matches=result["matches"], urgent=result["urgent"])
    db.add(record)
    db.commit()
    db.refresh(record)
    return prediction_json(record)

@app.get("/api/predictions")
def get_predictions(db: Db, user: Me):
    records = db.scalars(select(Prediction).where(Prediction.user_id == user.id).order_by(Prediction.created_at.desc(), Prediction.id.desc()).limit(200)).all()
    return [prediction_json(item) for item in records]

@app.get("/api/predictions/{record_id}")
def get_prediction(record_id: int, db: Db, user: Me):
    record = db.get(Prediction, record_id)
    if not record or record.user_id != user.id:
        raise HTTPException(404, "Prediction not found")
    return prediction_json(record)

@app.delete("/api/predictions/{record_id}", status_code=204)
def delete_prediction(record_id: int, db: Db, user: Me):
    record = db.get(Prediction, record_id)
    if not record or record.user_id != user.id:
        raise HTTPException(404, "Prediction not found")
    db.delete(record)
    db.commit()
    return Response(status_code=204)

@app.get("/api/predictions/{record_id}/report")
def download_report(record_id: int, db: Db, user: Me):
    record = db.get(Prediction, record_id)
    if not record or record.user_id != user.id:
        raise HTTPException(404, "Prediction not found")
    names = {c.slug: c.name for c in db.scalars(select(Condition)).all()}
    return StreamingResponse(make_pdf(record, user, names), media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="claritycare-report-{record.id}.pdf"', "Cache-Control": "no-store"})

@app.post("/api/health-assistant")
def assistant(payload: AssistantInput, user: Me):
    return {"answer": health_answer(payload.message), "mode": "rule-based educational assistant", "disclaimer": "Not medical advice or a diagnosis"}

@app.get("/api/dashboard")
def dashboard(db: Db, user: Me):
    records = db.scalars(select(Prediction).where(Prediction.user_id == user.id).order_by(Prediction.created_at.desc(), Prediction.id.desc()).limit(200)).all()
    count = db.scalar(select(func.count(Prediction.id)).where(Prediction.user_id == user.id)) or 0
    return {"total_predictions": count, "recent": [prediction_json(item) for item in records[:4]], "activity": [{"date": (datetime.now(timezone.utc).date() - timedelta(days=day)).isoformat(), "count": sum(item.created_at.date() == (datetime.now(timezone.utc).date() - timedelta(days=day)) for item in records)} for day in range(6, -1, -1)]}

@app.get("/api/admin/summary")
def admin_summary(db: Db, admin: Admin):
    total_users = db.scalar(select(func.count(User.id))) or 0
    total_predictions = db.scalar(select(func.count(Prediction.id))) or 0
    # Aggregate analytics only; never return other users' symptom selections or histories.
    recent_date = datetime.now(timezone.utc).date()
    recent_count = sum(stamp.date() == recent_date for stamp in db.scalars(select(Prediction.created_at)).all())
    return {"users": total_users, "predictions": total_predictions, "today_predictions": recent_count, "conditions": db.scalar(select(func.count(Condition.slug))) or 0}

@app.get("/api/admin/users")
def admin_users(db: Db, admin: Admin):
    return [{"id": u.id, "name": u.name, "email": u.email, "created_at": u.created_at} for u in db.scalars(select(User).order_by(User.created_at.desc()).limit(100)).all()]

@app.put("/api/admin/conditions/{slug}")
def update_condition(slug: str, payload: ConditionInput, db: Db, admin: Admin):
    condition = db.get(Condition, slug)
    if not condition:
        raise HTTPException(404, "Condition not found")
    for key, value in payload.model_dump().items():
        setattr(condition, key, value)
    db.commit()
    return condition_json(condition)

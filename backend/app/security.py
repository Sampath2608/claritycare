import os
from datetime import datetime, timedelta, timezone
import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError
from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from .database import get_db
from .models import User

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY", "")
if len(SECRET_KEY) < 32:
    raise RuntimeError("Set SECRET_KEY to a random value of at least 32 characters; see .env.example")
_password_hasher = PasswordHasher()
_bearer = HTTPBearer(auto_error=False)

def hash_password(password: str) -> str:
    return _password_hasher.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    try:
        return _password_hasher.verify(hashed, password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False

def create_token(user_id: int) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode({"sub": str(user_id), "iat": now, "exp": now + timedelta(hours=8)}, SECRET_KEY, algorithm="HS256")

def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(_bearer), db: Session = Depends(get_db)) -> User:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(401, "Authentication required", headers={"WWW-Authenticate": "Bearer"})
    try:
        claims = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=["HS256"])
        user_id = int(claims["sub"])
    except (jwt.PyJWTError, KeyError, ValueError, TypeError):
        raise HTTPException(401, "Invalid or expired login", headers={"WWW-Authenticate": "Bearer"})
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(401, "User not found")
    return user

def admin_user(user: User = Depends(current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(403, "Administrator access required")
    return user

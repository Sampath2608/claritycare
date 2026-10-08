"""Locally promote an existing registered user; never create an admin from HTTP."""
import sys
from sqlalchemy import select
from app.database import SessionLocal
from app.models import User

if len(sys.argv) != 2:
    raise SystemExit("Usage: python promote_admin.py email@example.com")
with SessionLocal() as db:
    user = db.scalar(select(User).where(User.email == sys.argv[1].lower().strip()))
    if not user:
        raise SystemExit("Account not found")
    user.is_admin = True
    db.commit()
    print(f"Promoted {user.email} to admin")

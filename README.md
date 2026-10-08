# ClarityCare AI — Educational Symptom Explorer

A complete college-project **starter application** built with React + Vite, FastAPI, SQLAlchemy, SQLite (or PostgreSQL), JWT authentication, Argon2 password hashing, Scikit-learn, and PDF reports.

> **Important:** The model uses only generated synthetic example data. It is **not clinically validated**, is **not a medical device**, and cannot diagnose, screen for, or rule out any disease. Percentages are uncalibrated demonstration model rankings, **not disease probabilities**. Do not use this prototype to make personal medical decisions.

## Included modules

- Login and registration; password hashes with Argon2, signed 8-hour JWTs
- Personal dashboard with 7-day activity chart
- Searchable symptom selector; top-three synthetic symptom-pattern rankings
- Urgent symptom escalation (suppresses rankings; directs to urgent medical care)
- Persisted prediction history with per-user ownership checks, deletion, PDF reports
- General educational condition library
- Rule-based health information Q&A (not an LLM and not medical advice)
- Profile editing and account deletion
- Restricted admin metrics, user list, and editable condition guides (no other users' health histories)
- Model training pipeline comparing logistic regression, random forest, decision tree
- Tests for authentication, access isolation, red-flag handling, reports and admin authorization

## Requirements

- Python 3.10+ (3.11 or 3.12 recommended)
- Node.js 20.19+ or 22.12+ (Vite 6 also supports many earlier compatible versions)

## Run backend (terminal 1)

```bash
cd backend
python -m venv .venv
# Windows PowerShell: .venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
# Windows PowerShell: Copy-Item .env.example .env
# macOS/Linux: cp .env.example .env
```

**Change `SECRET_KEY` inside `backend/.env`**, generating one with:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Then start:

```bash
python train_model.py
uvicorn app.main:app --reload
```

API docs: <http://localhost:8000/docs>.

**For tests**, run from `backend/`:

```bash
pytest -q
```

## Run frontend (terminal 2)

```bash
cd frontend
npm install
# Windows PowerShell: Copy-Item .env.example .env
# macOS/Linux: cp .env.example .env
npm run dev
```

Visit <http://localhost:5173>. Create an account and begin exploring.

## PostgreSQL alternative

Set `DATABASE_URL` in `backend/.env` to:

```ini
DATABASE_URL=postgresql+psycopg://dbuser:dbpassword@localhost:5432/claritycare
```

The included tables are created on startup for development. For production, use Alembic migrations instead.

## Enable admin for an existing account

Create a normal account first, then in the backend terminal:

```bash
python promote_admin.py you@example.com
```

Log out and back in. The Admin dashboard will appear. Admins are not created via public API requests.

## API overview

| Method | Endpoint | Usage |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Get access token |
| GET/PUT/DELETE | `/api/user/profile` | Profile / account deletion |
| GET | `/api/symptoms` | Grouped symptom catalogue |
| POST | `/api/predict` | Safety filter and demo ranking |
| GET | `/api/predictions` | Your records |
| GET/DELETE | `/api/predictions/{id}` | Your record |
| GET | `/api/predictions/{id}/report` | Your PDF report |
| GET | `/api/conditions` | Educational guide library |
| POST | `/api/health-assistant` | Restricted rule-based Q&A |
| GET | `/api/dashboard` | Personal summary |
| GET | `/api/admin/summary` | Aggregate admin metrics |
| GET | `/api/admin/users` | Basic user list |
| PUT | `/api/admin/conditions/{slug}` | Update educational guide |

All personal and administrative APIs require `Authorization: Bearer <token>`.

## How ML works

The script `backend/train_model.py` generates synthetic examples for six broad symptom-pattern labels, converts symptom selection to binary vectors, runs a stratified train/test split, compares three classifiers, and chooses the highest synthetic macro F1. The output in `backend/artifacts/disease_model.joblib` is locally generated with `joblib`; **never load model pickle/joblib artifacts from untrusted sources**.

The evaluation split comes from the **same synthetic generator**, so reported metrics only show the model learned those toy patterns. They say nothing about accuracy on patients, underrepresented populations, real illnesses, or clinical utility. A real-world application needs clinically sourced licensed data, medical oversight, independent external validation, calibration, subgroup evaluation, security/privacy compliance, monitoring, and relevant regulatory approval.

## Security and production improvements

This is a local learning prototype, not deploy-as-is clinical software. Before handling real health data or publishing publicly:

1. Replace JWT-in-sessionStorage with carefully configured secure HttpOnly cookie sessions, CSRF protection, token revocation/refresh as needed, and stronger account recovery.
2. Add rate limits, email verification, secure forgot-password flow, audit logging, TLS, deployment-specific CORS, security headers and backups.
3. Add consent notices, privacy policy, retention policies, deletion/export verification, encryption, operational access controls and appropriate local legal compliance.
4. Use Alembic migrations, database connection pooling, structured error logging, automated CI, more robust tests and production monitoring.
5. Have qualified clinicians and security reviewers validate all medical content, escalation behavior, model claims and safety boundaries.
6. Health assistant is **rule-based**. An optional LLM can be integrated later with separate controls, citation checking, content filtering, and escalation review.
7. A forgot-password feature needs a secure email reset workflow and SMTP provider, and is intentionally not mocked as secure.

## Repository layout

```text
claritycare-ai/
├── backend/
│   ├── app/
│   │   ├── main.py, database.py, models.py, security.py
│   │   ├── ml.py, content.py, report.py
│   ├── artifacts/                 # trusted local demo model and training metadata
│   ├── train_model.py
│   ├── promote_admin.py
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   ├── src/                      # React UI, styles, API client
│   └── package.json
└── README.md
```

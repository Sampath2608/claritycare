"""Smoke tests exercising full FastAPI request flows and private data boundaries."""
import os
import tempfile
from pathlib import Path
os.environ["SECRET_KEY"] = "test-key-only-for-automated-suite-0123456789ABCDEF"
os.environ["DATABASE_URL"] = "sqlite:///" + str(Path(tempfile.mkdtemp(prefix="claritycare-tests-")) / "test.db")
from fastapi.testclient import TestClient
from sqlalchemy import select
from app.database import SessionLocal
from app.main import app
from app.models import User


def auth(client, email, name='Test Person'):
    r = client.post('/api/auth/register', json={'name': name, 'email': email, 'password': 'a-strong-password-123'})
    assert r.status_code == 201, r.text
    return {'Authorization': 'Bearer ' + r.json()['token']}


def test_full_user_journey_and_privacy():
    with TestClient(app) as client:
        alice = auth(client, 'alice@test.example')
        bob = auth(client, 'bob@test.example', 'Other User')
        assert client.get('/api/health').json()['status'] == 'ok'
        assert len(client.get('/api/symptoms').json()) >= 4
        assert len(client.get('/api/conditions').json()) == 6
        assert client.post('/api/auth/login', json={'email': 'alice@test.example', 'password': 'wrong-password'}).status_code == 401
        assert client.get('/api/predictions').status_code == 401
        prediction = client.post('/api/predict', json={'symptoms': ['fever', 'cough', 'body_aches']}, headers=alice)
        assert prediction.status_code == 201, prediction.text
        result = prediction.json()
        assert not result['urgent'] and len(result['matches']) == 3
        assert all(0 <= x['score'] <= 100 for x in result['matches'])
        rid = result['id']
        assert len(client.get('/api/predictions', headers=alice).json()) == 1
        assert len(client.get('/api/predictions', headers=bob).json()) == 0
        assert client.get(f'/api/predictions/{rid}', headers=bob).status_code == 404
        assert client.get(f'/api/predictions/{rid}/report', headers=bob).status_code == 404
        pdf = client.get(f'/api/predictions/{rid}/report', headers=alice)
        assert pdf.status_code == 200 and pdf.content.startswith(b'%PDF')
        assert client.get('/api/dashboard', headers=alice).json()['total_predictions'] == 1
        assert client.post('/api/predict', json={'symptoms': ['unknown']}, headers=alice).status_code == 422
        assert client.post('/api/predict', json={'symptoms': ['fever', 'fever']}, headers=alice).status_code == 422
        assert client.get('/api/admin/summary', headers=alice).status_code == 403
        assert client.post('/api/health-assistant', json={'message': 'What does the score mean?'}, headers=alice).status_code == 200
        assert client.delete(f'/api/predictions/{rid}', headers=bob).status_code == 404
        assert client.delete(f'/api/predictions/{rid}', headers=alice).status_code == 204
        assert client.get('/api/predictions', headers=alice).json() == []


def test_red_flags_suppress_prediction():
    with TestClient(app) as client:
        alice = auth(client, 'urgent@test.example')
        result = client.post('/api/predict', json={'symptoms': ['chest_pain', 'fever']}, headers=alice)
        assert result.status_code == 201, result.text
        assert result.json()['urgent'] is True
        assert result.json()['matches'] == []
        assert client.get(f"/api/predictions/{result.json()['id']}/report", headers=alice).content.startswith(b'%PDF')


def test_admin_authorization_and_account_deletion():
    with TestClient(app) as client:
        auth_header = auth(client, 'admin@test.example')
        with SessionLocal() as session:
            user = session.scalar(select(User).where(User.email == 'admin@test.example'))
            user.is_admin = True
            session.commit()
        summary = client.get('/api/admin/summary', headers=auth_header)
        assert summary.status_code == 200, summary.text
        assert summary.json()['users'] >= 1
        assert client.get('/api/admin/users', headers=auth_header).status_code == 200
        assert client.put('/api/admin/conditions/cold-like', headers=auth_header, json={
            'name': 'Common cold-like symptoms', 'summary': 'Educational symptoms can have different causes.',
            'common_symptoms': ['Cough'], 'prevention': 'Practise hand hygiene.',
            'when_to_seek_care': 'Speak with a qualified clinician.'
        }).status_code == 200
        assert client.delete('/api/user/profile', headers=auth_header).status_code == 204
        assert client.get('/api/user/profile', headers=auth_header).status_code == 401

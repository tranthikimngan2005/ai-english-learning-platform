import pytest
import sys
import os
import tempfile
import uuid
from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.core.database import Base, get_db
from app.core.security import hash_password
from app.main import app
from app.models.user import ContentStatusEnum, Lesson, RoleEnum, SkillEnum, LevelEnum, User


_tmpfile = os.path.join(tempfile.gettempdir(), f"test_admin_lessons_{uuid.uuid4().hex}.db")
TEST_DB_URL = f"sqlite:///{_tmpfile}"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
SEEDED_PASSWORD = "password"



@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = TestSession()
    try:
        if not db.query(User).filter(User.email == "admin@test.com").first():
            db.add(
                User(
                    username="admin",
                    email="admin@test.com",
                    hashed_password=hash_password(SEEDED_PASSWORD),
                    role=RoleEnum.admin,
                )
            )
        if not db.query(User).filter(User.email == "creator@test.com").first():
            db.add(
                User(
                    username="creator",
                    email="creator@test.com",
                    hashed_password=hash_password(SEEDED_PASSWORD),
                    role=RoleEnum.creator,
                )
            )
        db.commit()
    finally:
        db.close()
    yield
    Base.metadata.drop_all(bind=engine)


def override_get_db():
    db = TestSession()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def client():
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.pop(get_db, None)


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def login(client: TestClient, email: str, password: str = SEEDED_PASSWORD) -> str:
    response = client.post(
        "/api/auth/login",
        data={"username": email, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]

class TestLessonsAndAdmin:
    def test_creator_can_create_and_admin_can_moderate_lesson(self, client):
        creator_token = login(client, "creator@test.com")
        admin_token = login(client, "admin@test.com")

        create_response = client.post(
            "/api/lessons",
            json={
                "title": "Past Simple Basics",
                "skill": "reading",
                "level": "A1",
                "content": "Past simple is used for finished actions.",
                "audio_url": None,
            },
            headers=auth_headers(creator_token),
        )
        assert create_response.status_code == 201, create_response.text
        lesson_id = create_response.json()["id"]
        assert create_response.json()["status"] == ContentStatusEnum.pending.value

        moderate_response = client.patch(
            f"/api/lessons/{lesson_id}/moderate",
            json={"status": ContentStatusEnum.approved},
            headers=auth_headers(admin_token),
        )
        assert moderate_response.status_code == 200, moderate_response.text
        assert moderate_response.json()["status"] == ContentStatusEnum.approved.value

        list_response = client.get("/api/lessons", headers=auth_headers(creator_token))
        assert list_response.status_code == 200, list_response.text
        assert any(item["id"] == lesson_id for item in list_response.json())

    def test_admin_stats_and_user_controls_work(self, client):
        creator_token = login(client, "creator@test.com")
        admin_token = login(client, "admin@test.com")

        lesson_response = client.post(
            "/api/lessons",
            json={
                "title": "Vocabulary Set",
                "skill": "reading",
                "level": "A2",
                "content": "Useful travel vocabulary.",
                "audio_url": None,
            },
            headers=auth_headers(creator_token),
        )
        assert lesson_response.status_code == 201, lesson_response.text

        stats_response = client.get("/api/admin/stats", headers=auth_headers(admin_token))
        assert stats_response.status_code == 200, stats_response.text
        stats = stats_response.json()
        assert stats["total_lessons"] >= 1
        assert stats["pending_lessons"] >= 1

        role_response = client.patch(
            "/api/admin/users/2/role",
            json={"role": "student"},
            headers=auth_headers(admin_token),
        )
        assert role_response.status_code == 200, role_response.text
        assert role_response.json()["role"] == "student"

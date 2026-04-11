"""
Test suite for LingAI API.
Run with: pytest tests/test_api.py -v
"""
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db
from app.core.security import hash_password
from app.core.time import utc_now_naive

# ── In-memory SQLite for tests ──────────────────────────────
TEST_DB_URL = "sqlite:///./test_lingai.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
SEEDED_PASSWORD = "password"


def seed_users_from_sql():
    sql_path = Path(__file__).with_name("users.sql")
    now = utc_now_naive()
    sql_script = sql_path.read_text(encoding="utf-8")
    with engine.begin() as conn:
        # SQLite needs executescript for multi-statement SQL files.
        conn.connection.driver_connection.executescript(sql_script)
        # Keep user list from SQL, but force a known password for deterministic login tests.
        conn.exec_driver_sql(
            "UPDATE users SET hashed_password = :hashed_pw",
            {"hashed_pw": hash_password(SEEDED_PASSWORD)},
        )
        conn.exec_driver_sql(
            "UPDATE users SET created_at = :now WHERE created_at IS NULL",
            {"now": now},
        )


def seed_questions_from_sql():
    """Load questions from question.sql file."""
    sql_path = Path(__file__).with_name("question.sql")
    if sql_path.exists():
        sql_script = sql_path.read_text(encoding="utf-8")
        with engine.begin() as conn:
            # SQLite needs executescript for multi-statement SQL files.
            conn.connection.driver_connection.executescript(sql_script)


def override_get_db():
    db = TestSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    seed_users_from_sql()
    seed_questions_from_sql()
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)


# ── Helpers ─────────────────────────────────────────────────

def register_and_login(client, username="testuser", email="test@test.com", password="secret123"):
    client.post("/api/auth/register", json={"username": username, "email": email, "password": password})
    resp = client.post(
        "/api/auth/login",
        data={"username": email, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    return resp.json()["access_token"]


def login_seeded(client, email: str, password: str = SEEDED_PASSWORD):
    resp = client.post(
        "/api/auth/login",
        data={"username": email, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


def register_admin(client):
    return login_seeded(client, "admin@test.com")


def register_creator(client):
    return login_seeded(client, "creator1@test.com")


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def create_approved_question(client, creator_token, admin_token):
    """Create and approve a question, return its id."""
    q = client.post("/api/questions", json={
        "skill": "reading", "level": "B1", "q_type": "mcq",
        "content": "Which word means happy?",
        "options": ["sad", "joyful", "angry", "tired"],
        "correct_answer": "joyful",
        "explanation": "Joyful means feeling great happiness.",
    }, headers=auth_headers(creator_token))
    qid = q.json()["id"]
    client.patch(f"/api/questions/{qid}/moderate",
                 json={"status": "approved"}, headers=auth_headers(admin_token))
    return qid


# ════════════════════════════════════════════════════════════
# AUTH TESTS
# ════════════════════════════════════════════════════════════

class TestSeededUsers:
    def test_seeded_users_loaded(self):
        db = TestSession()
        from app.models.user import User

        rows = db.query(User).order_by(User.id.asc()).all()
        db.close()

        assert len(rows) == 50
        assert rows[0].email == "admin@test.com"
        assert rows[1].email == "creator1@test.com"
        assert rows[-1].email == "user44@test.com"
class TestAuth:
    def test_register_success(self, client):
        r = client.post("/api/auth/register", json={
            "username": "alice", "email": "alice@test.com", "password": "pass1234"
        })
        assert r.status_code == 201
        data = r.json()
        assert "access_token" in data
        assert data["username"] == "alice"
        assert data["role"] == "student"

    def test_register_duplicate_email(self, client):
        client.post("/api/auth/register", json={"username": "a", "email": "dup@test.com", "password": "123456"})
        r = client.post("/api/auth/register", json={"username": "b", "email": "dup@test.com", "password": "123456"})
        assert r.status_code == 400

    def test_register_duplicate_username(self, client):
        client.post("/api/auth/register", json={"username": "same", "email": "a@test.com", "password": "123456"})
        r = client.post("/api/auth/register", json={"username": "same", "email": "b@test.com", "password": "123456"})
        assert r.status_code == 400

    def test_register_short_password(self, client):
        r = client.post("/api/auth/register", json={"username": "u", "email": "u@test.com", "password": "ab"})
        assert r.status_code == 422

    def test_login_success(self, client):
        client.post("/api/auth/register", json={"username": "bob", "email": "bob@test.com", "password": "pass1234"})
        r = client.post("/api/auth/login",
                        data={"username": "bob@test.com", "password": "pass1234"},
                        headers={"Content-Type": "application/x-www-form-urlencoded"})
        assert r.status_code == 200
        assert "access_token" in r.json()

    def test_login_wrong_password(self, client):
        client.post("/api/auth/register", json={"username": "bob2", "email": "bob2@test.com", "password": "correct"})
        r = client.post("/api/auth/login",
                        data={"username": "bob2@test.com", "password": "wrong"},
                        headers={"Content-Type": "application/x-www-form-urlencoded"})
        assert r.status_code == 401

    def test_login_by_username(self, client):
        client.post("/api/auth/register", json={"username": "charlie", "email": "c@test.com", "password": "pass1234"})
        r = client.post("/api/auth/login",
                        data={"username": "charlie", "password": "pass1234"},
                        headers={"Content-Type": "application/x-www-form-urlencoded"})
        assert r.status_code == 200


# ════════════════════════════════════════════════════════════
# USER / DASHBOARD TESTS
# ════════════════════════════════════════════════════════════

class TestUsers:
    def test_get_me(self, client):
        token = register_and_login(client)
        r = client.get("/api/users/me", headers=auth_headers(token))
        assert r.status_code == 200
        assert r.json()["username"] == "testuser"

    def test_get_me_no_auth(self, client):
        r = client.get("/api/users/me")
        assert r.status_code == 401

    def test_dashboard(self, client):
        token = register_and_login(client)
        r = client.get("/api/users/me/dashboard", headers=auth_headers(token))
        assert r.status_code == 200
        data = r.json()
        assert "streak" in data
        assert "skill_profiles" in data
        assert len(data["skill_profiles"]) == 4  # reading, listening, writing, speaking
        assert "due_reviews" in data

    def test_progress(self, client):
        token = register_and_login(client)
        r = client.get("/api/users/me/progress", headers=auth_headers(token))
        assert r.status_code == 200
        assert len(r.json()) == 4


# ════════════════════════════════════════════════════════════
# LESSONS TESTS
# ════════════════════════════════════════════════════════════

class TestLessons:
    def test_create_lesson_as_creator(self, client):
        token = register_creator(client)
        r = client.post("/api/lessons", json={
            "title": "Reading B1 Basics",
            "skill": "reading", "level": "B1",
            "content": "This is the lesson content.",
        }, headers=auth_headers(token))
        assert r.status_code == 201
        assert r.json()["status"] == "pending"

    def test_create_lesson_as_student_forbidden(self, client):
        token = register_and_login(client)
        r = client.post("/api/lessons", json={
            "title": "Test", "skill": "reading", "level": "A1", "content": "x"
        }, headers=auth_headers(token))
        assert r.status_code == 403

    def test_list_lessons_only_approved(self, client):
        creator_token = register_creator(client)
        admin_token = register_admin(client)
        # create + approve
        r = client.post("/api/lessons", json={
            "title": "Approved Lesson", "skill": "listening", "level": "A2", "content": "content"
        }, headers=auth_headers(creator_token))
        lid = r.json()["id"]
        client.patch(f"/api/lessons/{lid}/moderate",
                     json={"status": "approved"}, headers=auth_headers(admin_token))

        student_token = register_and_login(client, "student1", "s@test.com")
        r = client.get("/api/lessons?skill=listening", headers=auth_headers(student_token))
        assert r.status_code == 200
        assert any(l["id"] == lid for l in r.json())

    def test_moderate_lesson(self, client):
        creator_token = register_creator(client)
        admin_token = register_admin(client)
        r = client.post("/api/lessons", json={
            "title": "Pending Lesson", "skill": "writing", "level": "B2", "content": "c"
        }, headers=auth_headers(creator_token))
        lid = r.json()["id"]
        r2 = client.patch(f"/api/lessons/{lid}/moderate",
                          json={"status": "rejected"}, headers=auth_headers(admin_token))
        assert r2.status_code == 200
        assert r2.json()["status"] == "rejected"


# ════════════════════════════════════════════════════════════
# QUESTIONS TESTS
# ════════════════════════════════════════════════════════════

class TestQuestions:
    def test_create_question(self, client):
        token = register_creator(client)
        r = client.post("/api/questions", json={
            "skill": "reading", "level": "B1", "q_type": "mcq",
            "content": "Choose the synonym of 'happy'",
            "options": ["sad", "joyful", "angry", "bored"],
            "correct_answer": "joyful",
        }, headers=auth_headers(token))
        assert r.status_code == 201
        assert r.json()["status"] == "pending"

    def test_create_fill_blank(self, client):
        token = register_creator(client)
        r = client.post("/api/questions", json={
            "skill": "writing", "level": "A2", "q_type": "fill_blank",
            "content": "She ___ (go) to school every day.",
            "correct_answer": "goes",
            "explanation": "Third person singular present simple.",
        }, headers=auth_headers(token))
        assert r.status_code == 201

    def test_moderate_question(self, client):
        creator_token = register_creator(client)
        admin_token = register_admin(client)
        r = client.post("/api/questions", json={
            "skill": "reading", "level": "A1", "q_type": "mcq",
            "content": "Q?", "options": ["A", "B"], "correct_answer": "A",
        }, headers=auth_headers(creator_token))
        qid = r.json()["id"]
        r2 = client.patch(f"/api/questions/{qid}/moderate",
                          json={"status": "approved"}, headers=auth_headers(admin_token))
        assert r2.json()["status"] == "approved"

    def test_delete_own_question(self, client):
        token = register_creator(client)
        r = client.post("/api/questions", json={
            "skill": "listening", "level": "A1", "q_type": "mcq",
            "content": "Q?", "options": ["A", "B"], "correct_answer": "A",
        }, headers=auth_headers(token))
        qid = r.json()["id"]
        r2 = client.delete(f"/api/questions/{qid}", headers=auth_headers(token))
        assert r2.status_code == 204


# ════════════════════════════════════════════════════════════
# PRACTICE TESTS
# ════════════════════════════════════════════════════════════

class TestPractice:
    def test_start_practice_empty(self, client):
        token = register_and_login(client)
        r = client.post("/api/questions/practice/start",
                        json={"skill": "reading", "count": 5},
                        headers=auth_headers(token))
        assert r.status_code == 200
        # Now that we have seeded questions, we should get some
        assert len(r.json()["questions"]) > 0

    def test_start_practice_with_questions(self, client):
        creator_token = register_creator(client)
        admin_token = register_admin(client)
        create_approved_question(client, creator_token, admin_token)
        student_token = register_and_login(client, "s1", "s1@test.com")
        r = client.post("/api/questions/practice/start",
                        json={"skill": "reading", "count": 5},
                        headers=auth_headers(student_token))
        assert r.status_code == 200
        assert len(r.json()["questions"]) >= 1

    def test_submit_correct_answer(self, client):
        creator_token = register_creator(client)
        admin_token = register_admin(client)
        qid = create_approved_question(client, creator_token, admin_token)
        student_token = register_and_login(client, "s2", "s2@test.com")
        r = client.post("/api/questions/practice/submit",
                        json={"question_id": qid, "user_answer": "joyful"},
                        headers=auth_headers(student_token))
        assert r.status_code == 200
        data = r.json()
        assert data["is_correct"] is True
        assert data["xp_gained"] == 10

    def test_submit_wrong_answer(self, client):
        creator_token = register_creator(client)
        admin_token = register_admin(client)
        qid = create_approved_question(client, creator_token, admin_token)
        student_token = register_and_login(client, "s3", "s3@test.com")
        r = client.post("/api/questions/practice/submit",
                        json={"question_id": qid, "user_answer": "sad"},
                        headers=auth_headers(student_token))
        assert r.status_code == 200
        data = r.json()
        assert data["is_correct"] is False
        assert data["xp_gained"] == 2
        assert data["correct_answer"] == "joyful"

    def test_submit_updates_skill_profile(self, client):
        creator_token = register_creator(client)
        admin_token = register_admin(client)
        qid = create_approved_question(client, creator_token, admin_token)
        student_token = register_and_login(client, "s4", "s4@test.com")
        client.post("/api/questions/practice/submit",
                    json={"question_id": qid, "user_answer": "joyful"},
                    headers=auth_headers(student_token))
        r = client.get("/api/users/me/progress", headers=auth_headers(student_token))
        reading = next(p for p in r.json() if p["skill"] == "reading")
        assert reading["questions_done"] == 1
        assert reading["questions_correct"] == 1


# ════════════════════════════════════════════════════════════
# REVIEW (SPACED REPETITION) TESTS
# ════════════════════════════════════════════════════════════

class TestReview:
    def test_due_cards_empty(self, client):
        token = register_and_login(client)
        r = client.get("/api/review/due", headers=auth_headers(token))
        assert r.status_code == 200
        assert r.json() == []

    def test_correct_answer_does_not_create_review_card(self, client):
        creator_token = register_creator(client)
        admin_token = register_admin(client)
        qid = create_approved_question(client, creator_token, admin_token)
        student_token = register_and_login(client, "s5", "s5@test.com")
        client.post("/api/questions/practice/submit",
                    json={"question_id": qid, "user_answer": "joyful"},
                    headers=auth_headers(student_token))

        db = TestSession()
        from app.models.user import ReviewCard
        cards = db.query(ReviewCard).all()
        db.close()
        assert len(cards) == 0

    def test_wrong_answer_creates_card_with_first_window(self, client):
        creator_token = register_creator(client)
        admin_token = register_admin(client)
        qid = create_approved_question(client, creator_token, admin_token)
        student_token = register_and_login(client, "s5b", "s5b@test.com")
        client.post("/api/questions/practice/submit",
                    json={"question_id": qid, "user_answer": "sad"},
                    headers=auth_headers(student_token))

        db = TestSession()
        from app.models.user import ReviewCard
        from app.core.time import utc_now_naive
        card = db.query(ReviewCard).first()
        assert card is not None
        assert card.repetitions == 1
        minutes_until_due = (card.due_date - utc_now_naive()).total_seconds() / 60
        db.close()
        assert 8 <= minutes_until_due <= 32

        r = client.get("/api/review/due", headers=auth_headers(student_token))
        assert r.status_code == 200
        assert r.json() == []

    def test_submit_review(self, client):
        """Manually create a due card and submit review."""
        creator_token = register_creator(client)
        admin_token = register_admin(client)
        qid = create_approved_question(client, creator_token, admin_token)
        student_token = register_and_login(client, "s6", "s6@test.com")
        # First attempt creates the card
        client.post("/api/questions/practice/submit",
                json={"question_id": qid, "user_answer": "sad"},
                headers=auth_headers(student_token))
        # Force card to be due now
        db = TestSession()
        from app.models.user import ReviewCard
        from app.core.time import utc_now_naive
        card = db.query(ReviewCard).first()
        card.due_date = utc_now_naive()
        db.commit()
        db.close()

        r = client.get("/api/review/due", headers=auth_headers(student_token))
        assert len(r.json()) >= 1
        card_id = r.json()[0]["id"]

        r2 = client.post("/api/review/submit",
                         json={"card_id": card_id, "result": "good"},
                         headers=auth_headers(student_token))
        assert r2.status_code == 200
        assert r2.json()["interval_days"] == 1

    def test_fixed_schedule_progression(self, client):
        creator_token = register_creator(client)
        admin_token = register_admin(client)
        qid = create_approved_question(client, creator_token, admin_token)
        student_token = register_and_login(client, "s7", "s7@test.com")

        client.post("/api/questions/practice/submit",
                    json={"question_id": qid, "user_answer": "sad"},
                    headers=auth_headers(student_token))

        db = TestSession()
        from app.models.user import ReviewCard
        from app.core.time import utc_now_naive
        card = db.query(ReviewCard).first()
        card.due_date = utc_now_naive()
        db.commit()
        db.close()

        due = client.get("/api/review/due", headers=auth_headers(student_token)).json()
        card_id = due[0]["id"]

        # Step 2 => 1 day
        s2 = client.post("/api/review/submit",
                         json={"card_id": card_id, "result": "good"},
                         headers=auth_headers(student_token))
        assert s2.status_code == 200
        assert s2.json()["interval_days"] == 1

        # Step 3 => 3 days
        db = TestSession()
        card = db.query(ReviewCard).filter(ReviewCard.id == card_id).first()
        card.due_date = utc_now_naive()
        db.commit()
        db.close()
        s3 = client.post("/api/review/submit",
                         json={"card_id": card_id, "result": "good"},
                         headers=auth_headers(student_token))
        assert s3.status_code == 200
        assert s3.json()["interval_days"] == 3

        # Step 4 => 7 days
        db = TestSession()
        card = db.query(ReviewCard).filter(ReviewCard.id == card_id).first()
        card.due_date = utc_now_naive()
        db.commit()
        db.close()
        s4 = client.post("/api/review/submit",
                         json={"card_id": card_id, "result": "good"},
                         headers=auth_headers(student_token))
        assert s4.status_code == 200
        assert s4.json()["interval_days"] == 7

        # Step 5 => 14-28 days (reported as representative 21 days)
        db = TestSession()
        card = db.query(ReviewCard).filter(ReviewCard.id == card_id).first()
        card.due_date = utc_now_naive()
        db.commit()
        db.close()
        s5 = client.post("/api/review/submit",
                         json={"card_id": card_id, "result": "good"},
                         headers=auth_headers(student_token))
        assert s5.status_code == 200
        assert s5.json()["interval_days"] == 21


# ════════════════════════════════════════════════════════════
# CHAT TESTS
# ════════════════════════════════════════════════════════════

class TestChat:
    def test_send_message(self, client):
        token = register_and_login(client)
        r = client.post("/api/chat/send",
                        json={"content": "Yesterday I go to school."},
                        headers=auth_headers(token))
        assert r.status_code == 200
        assert r.json()["role"] == "user"

    def test_get_history(self, client):
        token = register_and_login(client)
        client.post("/api/chat/send", json={"content": "Hello"}, headers=auth_headers(token))
        client.post("/api/chat/ai-response", json={"content": "Hi! ..."}, headers=auth_headers(token))
        r = client.get("/api/chat/history", headers=auth_headers(token))
        assert r.status_code == 200
        assert len(r.json()) == 2

    def test_clear_history(self, client):
        token = register_and_login(client)
        client.post("/api/chat/send", json={"content": "msg"}, headers=auth_headers(token))
        client.delete("/api/chat/history", headers=auth_headers(token))
        r = client.get("/api/chat/history", headers=auth_headers(token))
        assert r.json() == []

    def test_system_prompt(self, client):
        token = register_and_login(client)
        r = client.get("/api/chat/system-prompt", headers=auth_headers(token))
        assert r.status_code == 200
        assert "system_prompt" in r.json()


# ════════════════════════════════════════════════════════════
# ADMIN TESTS
# ════════════════════════════════════════════════════════════

class TestAdmin:
    def test_stats(self, client):
        admin_token = register_admin(client)
        r = client.get("/api/admin/stats", headers=auth_headers(admin_token))
        assert r.status_code == 200
        data = r.json()
        assert "total_users" in data
        assert data["total_users"] >= 1

    def test_list_users(self, client):
        admin_token = register_admin(client)
        r = client.get("/api/admin/users", headers=auth_headers(admin_token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_not_listed_in_users(self, client):
        admin_token = register_admin(client)
        users = client.get("/api/admin/users", headers=auth_headers(admin_token)).json()
        assert not any(u["email"] == "admin@test.com" for u in users)

    def test_student_cannot_access_admin(self, client):
        token = register_and_login(client)
        r = client.get("/api/admin/stats", headers=auth_headers(token))
        assert r.status_code == 403

    def test_change_user_role(self, client):
        admin_token = register_admin(client)
        register_and_login(client, "newcreator", "nc@test.com")
        users = client.get("/api/admin/users", headers=auth_headers(admin_token)).json()
        nc = next(u for u in users if u["username"] == "newcreator")
        r = client.patch(f"/api/admin/users/{nc['id']}/role",
                         json={"role": "creator"}, headers=auth_headers(admin_token))
        assert r.json()["role"] == "creator"

    def test_admin_cannot_change_own_role(self, client):
        admin_token = register_admin(client)
        db = TestSession()
        from app.models.user import User
        admin_user = db.query(User).filter(User.email == "admin@test.com").first()
        admin_id = admin_user.id
        db.close()

        r = client.patch(
            f"/api/admin/users/{admin_id}/role",
            json={"role": "student"},
            headers=auth_headers(admin_token),
        )
        assert r.status_code == 400

    def test_ban_user(self, client):
        admin_token = register_admin(client)
        register_and_login(client, "bad_user", "bad@test.com")
        users = client.get("/api/admin/users", headers=auth_headers(admin_token)).json()
        bad = next(u for u in users if u["username"] == "bad_user")
        r = client.patch(f"/api/admin/users/{bad['id']}/ban",
                         json={"is_active": False}, headers=auth_headers(admin_token))
        assert r.json()["is_active"] is False

    def test_admin_cannot_ban_self(self, client):
        admin_token = register_admin(client)
        db = TestSession()
        from app.models.user import User
        admin_user = db.query(User).filter(User.email == "admin@test.com").first()
        admin_id = admin_user.id
        db.close()

        r = client.patch(
            f"/api/admin/users/{admin_id}/ban",
            json={"is_active": False},
            headers=auth_headers(admin_token),
        )
        assert r.status_code == 400

    def test_banned_user_cannot_login(self, client):
        admin_token = register_admin(client)
        register_and_login(client, "banned", "banned@test.com")
        users = client.get("/api/admin/users", headers=auth_headers(admin_token)).json()
        b = next(u for u in users if u["username"] == "banned")
        client.patch(f"/api/admin/users/{b['id']}/ban",
                     json={"is_active": False}, headers=auth_headers(admin_token))
        r = client.post("/api/auth/login",
                        data={"username": "banned@test.com", "password": "secret123"},
                        headers={"Content-Type": "application/x-www-form-urlencoded"})
        assert r.status_code == 403


# ════════════════════════════════════════════════════════════
# SPACED REPETITION ALGORITHM UNIT TESTS
# ════════════════════════════════════════════════════════════

class TestSM2Algorithm:
    def test_first_correct(self):
        from app.services.spaced_repetition import calculate_next_review, ReviewResultEnum
        interval, ease, reps, due = calculate_next_review(1, 2.5, 0, ReviewResultEnum.good)
        assert interval == 1
        assert reps == 1
        assert ease > 1.3

    def test_second_correct(self):
        from app.services.spaced_repetition import calculate_next_review, ReviewResultEnum
        interval, ease, reps, due = calculate_next_review(1, 2.5, 1, ReviewResultEnum.good)
        assert interval == 6
        assert reps == 2

    def test_third_correct_grows(self):
        from app.services.spaced_repetition import calculate_next_review, ReviewResultEnum
        interval, ease, reps, due = calculate_next_review(6, 2.5, 2, ReviewResultEnum.good)
        assert interval == 15  # 6 * 2.5

    def test_fail_resets(self):
        from app.services.spaced_repetition import calculate_next_review, ReviewResultEnum
        interval, ease, reps, due = calculate_next_review(15, 2.5, 5, ReviewResultEnum.again)
        assert interval == 1
        assert reps == 0

    def test_easy_boosts_ease(self):
        from app.services.spaced_repetition import calculate_next_review, ReviewResultEnum
        _, ease_good, _, _ = calculate_next_review(6, 2.5, 2, ReviewResultEnum.good)
        _, ease_easy, _, _ = calculate_next_review(6, 2.5, 2, ReviewResultEnum.easy)
        assert ease_easy > ease_good

    def test_ease_floor(self):
        from app.services.spaced_repetition import calculate_next_review, ReviewResultEnum
        _, ease, _, _ = calculate_next_review(1, 1.3, 0, ReviewResultEnum.again)
        assert ease >= 1.3

    def test_level_up_check(self):
        from app.services.spaced_repetition import level_up_check
        assert level_up_check(50, 40) is True   # 80% accuracy, 50 done
        assert level_up_check(50, 35) is False  # 70% accuracy, not enough
        assert level_up_check(30, 28) is False  # not enough questions

    def test_next_level(self):
        from app.services.spaced_repetition import next_level
        assert next_level("A1") == "A2"
        assert next_level("B2") == "C1"
        assert next_level("C2") is None

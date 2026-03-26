import pytest
from sqlalchemy.orm import sessionmaker
from sqlalchemy import event
from fastapi.testclient import TestClient

from app.main import app
from app.utils.db_utils import get_db
from app.connection.postgres_connection import engine
from app.models.db_models import Course, Unit, Chapter, Lesson

client = TestClient(app)

TestingSession = sessionmaker(bind=engine, autocommit=False, autoflush=False)


# ─── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSession(bind=connection)

    nested = session.begin_nested()

    @event.listens_for(session, "after_transaction_end")
    def restart_savepoint(session, trans):
        nonlocal nested
        if trans.nested and not nested.is_active:
            nested = session.begin_nested()

    def override_get_db():
        yield session

    app.dependency_overrides[get_db] = override_get_db

    yield session

    session.close()
    transaction.rollback()
    connection.close()
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def clear_overrides():
    yield
    app.dependency_overrides.clear()


# ─── Shared payloads ──────────────────────────────────────────────────────────

LEARNER_PAYLOAD = {
    "email": "learner@example.com",
    "password": "password123",
    "full_name": "Test Learner",
    "birthday": "2000-01-25",
    "gender": "male",
    "role": "learner",
}

TUTOR_PAYLOAD = {
    "email": "tutor@example.com",
    "password": "password123",
    "full_name": "Test Tutor",
    "birthday": "1990-05-10",
    "gender": "female",
    "role": "tutor",
}


# ─── Helpers ──────────────────────────────────────────────────────────────────

def signup_and_login(payload):
    client.post("/api/auth/signup", json=payload)
    resp = client.post("/api/auth/login", json={
        "email": payload["email"],
        "password": payload["password"],
    })
    return resp.json()["access_token"]


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


# ─── POST /api/course/create_course ───────────────────────────────────────────

class TestCreateCourse:
    def test_learner_cannot_create_course(self, db_session):
        token = signup_and_login(LEARNER_PAYLOAD)
        response = client.post(
            "/api/course/create_course",
            json={"name": "My Course", "description": "desc"},
            headers=auth_headers(token),
        )
        assert response.status_code == 403

    def test_unauthenticated_cannot_create_course(self, db_session):
        response = client.post(
            "/api/course/create_course",
            json={"name": "My Course", "description": "desc"},
        )
        assert response.status_code == 401

    def test_tutor_creates_course_returns_201_or_200(self, db_session):
        token = signup_and_login(TUTOR_PAYLOAD)
        response = client.post(
            "/api/course/create_course",
            json={"name": "Python Basics", "description": "Learn Python"},
            headers=auth_headers(token),
        )
        assert response.status_code in (200, 201)
        data = response.json()
        assert data["status"] == "Success"
        assert data["course_id"] is not None

    def test_tutor_creates_course_inserts_db_row(self, db_session):
        token = signup_and_login(TUTOR_PAYLOAD)
        response = client.post(
            "/api/course/create_course",
            json={"name": "Python Basics", "description": "Learn Python"},
            headers=auth_headers(token),
        )
        course_id = response.json()["course_id"]
        course = db_session.query(Course).filter(Course.id == course_id).first()
        assert course is not None
        assert course.name == "Python Basics"
        assert course.status == "draft"

    def test_duplicate_course_name_returns_400(self, db_session):
        token = signup_and_login(TUTOR_PAYLOAD)
        headers = auth_headers(token)
        client.post("/api/course/create_course",
                    json={"name": "Dup Course", "description": "desc"},
                    headers=headers)
        response = client.post("/api/course/create_course",
                               json={"name": "Dup Course", "description": "other"},
                               headers=headers)
        assert response.status_code == 400


# ─── POST /api/course/add_unit ────────────────────────────────────────────────

class TestAddUnit:
    def _create_course(self, token):
        resp = client.post(
            "/api/course/create_course",
            json={"name": "Test Course", "description": "desc"},
            headers=auth_headers(token),
        )
        return resp.json()["course_id"]

    def test_learner_cannot_add_unit(self, db_session):
        tutor_token = signup_and_login(TUTOR_PAYLOAD)
        course_id = self._create_course(tutor_token)

        learner_token = signup_and_login(LEARNER_PAYLOAD)
        response = client.post(
            "/api/course/add_unit",
            json={"name": "Unit 1", "description": "first unit", "course_id": course_id},
            headers=auth_headers(learner_token),
        )
        assert response.status_code == 403

    def test_add_unit_returns_success(self, db_session):
        token = signup_and_login(TUTOR_PAYLOAD)
        course_id = self._create_course(token)

        response = client.post(
            "/api/course/add_unit",
            json={"name": "Unit 1", "description": "first unit", "course_id": course_id},
            headers=auth_headers(token),
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["unit_id"] is not None
        assert data["unit_index"] == 1

    def test_add_unit_inserts_db_row(self, db_session):
        token = signup_and_login(TUTOR_PAYLOAD)
        course_id = self._create_course(token)

        response = client.post(
            "/api/course/add_unit",
            json={"name": "Unit 1", "description": "first unit", "course_id": course_id},
            headers=auth_headers(token),
        )
        unit_id = response.json()["unit_id"]
        unit = db_session.query(Unit).filter(Unit.id == unit_id).first()
        assert unit is not None
        assert unit.name == "Unit 1"
        assert unit.course_id == course_id

    def test_add_unit_to_nonexistent_course_returns_404(self, db_session):
        token = signup_and_login(TUTOR_PAYLOAD)
        response = client.post(
            "/api/course/add_unit",
            json={"name": "Unit 1", "description": "desc", "course_id": "nonexistent-id"},
            headers=auth_headers(token),
        )
        assert response.status_code == 404

    def test_another_tutor_cannot_add_unit_to_others_course(self, db_session):
        tutor1_token = signup_and_login(TUTOR_PAYLOAD)
        course_id = self._create_course(tutor1_token)

        tutor2_payload = {**TUTOR_PAYLOAD, "email": "tutor2@example.com"}
        tutor2_token = signup_and_login(tutor2_payload)

        response = client.post(
            "/api/course/add_unit",
            json={"name": "Unit 1", "description": "desc", "course_id": course_id},
            headers=auth_headers(tutor2_token),
        )
        assert response.status_code == 403


# ─── POST /api/course/add_lesson (via chapter) ────────────────────────────────

class TestAddLesson:
    def _setup_chapter(self, token):
        """Creates course → unit → chapter, returns (course_id, unit_id, chapter_id)."""
        course_resp = client.post(
            "/api/course/create_course",
            json={"name": "Test Course", "description": "desc"},
            headers=auth_headers(token),
        )
        course_id = course_resp.json()["course_id"]

        unit_resp = client.post(
            "/api/course/add_unit",
            json={"name": "Unit 1", "description": "unit desc", "course_id": course_id},
            headers=auth_headers(token),
        )
        unit_id = unit_resp.json()["unit_id"]

        chapter_resp = client.post(
            "/api/course/add_chapter",
            json={"name": "Chapter 1", "unit_id": unit_id},
            headers=auth_headers(token),
        )
        chapter_id = chapter_resp.json()["chapter_id"]
        return course_id, unit_id, chapter_id

    def test_learner_cannot_add_lesson(self, db_session):
        tutor_token = signup_and_login(TUTOR_PAYLOAD)
        _, _, chapter_id = self._setup_chapter(tutor_token)

        learner_token = signup_and_login(LEARNER_PAYLOAD)
        response = client.post(
            "/api/course/add_lesson",
            json={"name": "Lesson 1", "chapter_id": chapter_id},
            headers=auth_headers(learner_token),
        )
        assert response.status_code == 403

    def test_add_lesson_returns_success(self, db_session):
        token = signup_and_login(TUTOR_PAYLOAD)
        _, _, chapter_id = self._setup_chapter(token)

        response = client.post(
            "/api/course/add_lesson",
            json={"name": "Lesson 1", "chapter_id": chapter_id},
            headers=auth_headers(token),
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["lesson_id"] is not None
        assert data["lesson_index"] == 1

    def test_add_lesson_inserts_db_row(self, db_session):
        token = signup_and_login(TUTOR_PAYLOAD)
        _, _, chapter_id = self._setup_chapter(token)

        response = client.post(
            "/api/course/add_lesson",
            json={"name": "Lesson 1", "chapter_id": chapter_id},
            headers=auth_headers(token),
        )
        lesson_id = response.json()["lesson_id"]
        lesson = db_session.query(Lesson).filter(Lesson.id == lesson_id).first()
        assert lesson is not None
        assert lesson.name == "Lesson 1"
        assert lesson.chapter_id == chapter_id

    def test_add_lesson_to_nonexistent_chapter_returns_404(self, db_session):
        token = signup_and_login(TUTOR_PAYLOAD)
        response = client.post(
            "/api/course/add_lesson",
            json={"name": "Lesson 1", "chapter_id": "nonexistent-id"},
            headers=auth_headers(token),
        )
        assert response.status_code == 404

    def test_second_lesson_gets_incremented_index(self, db_session):
        token = signup_and_login(TUTOR_PAYLOAD)
        _, _, chapter_id = self._setup_chapter(token)

        client.post("/api/course/add_lesson",
                    json={"name": "Lesson 1", "chapter_id": chapter_id},
                    headers=auth_headers(token))
        response = client.post("/api/course/add_lesson",
                               json={"name": "Lesson 2", "chapter_id": chapter_id},
                               headers=auth_headers(token))

        assert response.json()["lesson_index"] == 2

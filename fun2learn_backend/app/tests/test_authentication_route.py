import pytest
from sqlalchemy.orm import sessionmaker
from sqlalchemy import event
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock

from app.main import app
from app.utils.db_utils import get_db
from app.utils.auth_utils import decode_access_token, verify_password
from app.connection.postgres_connection import engine
from app.models.db_models import User, UserInventory, ForgotPasswordRequests

client = TestClient(app)

TestingSession = sessionmaker(bind=engine, autocommit=False, autoflush=False)


# ─── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture
def db_session():
    """
    Yields a real SQLAlchemy session. Every test is wrapped in a transaction
    that is rolled back at teardown — the real DB is never modified.

    How it works:
      1. Open a real connection and begin an outer transaction T1.
      2. Create a SAVEPOINT (nested transaction) so the route's session.commit()
         flushes SQL into T1 without ever reaching the real DB.
      3. After each session.commit() the event listener re-creates the SAVEPOINT
         so subsequent commits in the same test also stay inside T1.
      4. After the test, rollback T1 — everything disappears.
    """
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSession(bind=connection)

    # Create initial SAVEPOINT
    nested = session.begin_nested()

    @event.listens_for(session, "after_transaction_end")
    def restart_savepoint(session, trans):
        nonlocal nested
        # Re-create the SAVEPOINT after each commit so the next commit in this
        # test also stays inside the outer transaction T1.
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
    """Ensure no leftover dependency overrides bleed between tests."""
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

GENERIC_RESET_MESSAGE = "If that email is registered, a reset code has been sent."


# ─── POST /api/auth/signup ────────────────────────────────────────────────────

class TestSignup:
    def test_signup_learner_returns_201_and_success(self, db_session):
        response = client.post("/api/auth/signup", json=LEARNER_PAYLOAD)

        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "success"
        assert data["message"] == "User registered successfully"
        assert data["user_id"] is not None

    def test_signup_learner_inserts_user_row(self, db_session):
        response = client.post("/api/auth/signup", json=LEARNER_PAYLOAD)

        user = db_session.query(User).filter(User.email == LEARNER_PAYLOAD["email"]).first()
        assert user is not None
        assert user.user_id == response.json()["user_id"]
        assert user.full_name == LEARNER_PAYLOAD["full_name"]
        assert user.role == "learner"

    def test_signup_learner_creates_inventory(self, db_session):
        response = client.post("/api/auth/signup", json=LEARNER_PAYLOAD)

        user = db_session.query(User).filter(User.email == LEARNER_PAYLOAD["email"]).first()
        inventory = db_session.query(UserInventory).filter(UserInventory.user_id == user.user_id).first()
        assert inventory is not None

    def test_signup_tutor_returns_201(self, db_session):
        response = client.post("/api/auth/signup", json=TUTOR_PAYLOAD)
        assert response.status_code == 201

    def test_signup_tutor_does_not_create_inventory(self, db_session):
        response = client.post("/api/auth/signup", json=TUTOR_PAYLOAD)

        user = db_session.query(User).filter(User.email == TUTOR_PAYLOAD["email"]).first()
        inventory = db_session.query(UserInventory).filter(UserInventory.user_id == user.user_id).first()
        assert inventory is None

    def test_signup_hashes_password_in_db(self, db_session):
        client.post("/api/auth/signup", json=LEARNER_PAYLOAD)

        user = db_session.query(User).filter(User.email == LEARNER_PAYLOAD["email"]).first()
        assert user.password != LEARNER_PAYLOAD["password"]
        assert user.password.startswith("$2b$")

    def test_signup_duplicate_email_returns_400(self, db_session):
        client.post("/api/auth/signup", json=LEARNER_PAYLOAD)
        response = client.post("/api/auth/signup", json=LEARNER_PAYLOAD)

        assert response.status_code == 400
        assert response.json()["detail"] == "Email already registered"

    def test_signup_duplicate_email_does_not_create_second_user(self, db_session):
        client.post("/api/auth/signup", json=LEARNER_PAYLOAD)
        client.post("/api/auth/signup", json=LEARNER_PAYLOAD)

        count = db_session.query(User).filter(User.email == LEARNER_PAYLOAD["email"]).count()
        assert count == 1

    # ── Validation (no DB needed) ─────────────────────────────────────────────

    def test_signup_missing_email_returns_422(self):
        payload = {k: v for k, v in LEARNER_PAYLOAD.items() if k != "email"}
        assert client.post("/api/auth/signup", json=payload).status_code == 422

    def test_signup_missing_password_returns_422(self):
        payload = {k: v for k, v in LEARNER_PAYLOAD.items() if k != "password"}
        assert client.post("/api/auth/signup", json=payload).status_code == 422

    def test_signup_missing_full_name_returns_422(self):
        payload = {k: v for k, v in LEARNER_PAYLOAD.items() if k != "full_name"}
        assert client.post("/api/auth/signup", json=payload).status_code == 422

    def test_signup_missing_birthday_returns_422(self):
        payload = {k: v for k, v in LEARNER_PAYLOAD.items() if k != "birthday"}
        assert client.post("/api/auth/signup", json=payload).status_code == 422

    def test_signup_invalid_role_returns_422(self):
        assert client.post("/api/auth/signup", json={**LEARNER_PAYLOAD, "role": "admin"}).status_code == 422

    def test_signup_invalid_birthday_format_returns_422(self):
        assert client.post("/api/auth/signup", json={**LEARNER_PAYLOAD, "birthday": "not-a-date"}).status_code == 422

    def test_signup_empty_body_returns_422(self):
        assert client.post("/api/auth/signup", json={}).status_code == 422


# ─── POST /api/auth/login ─────────────────────────────────────────────────────

class TestLogin:
    def test_login_success_returns_200_and_token(self, db_session):
        client.post("/api/auth/signup", json=LEARNER_PAYLOAD)

        response = client.post("/api/auth/login", json={
            "email": LEARNER_PAYLOAD["email"],
            "password": LEARNER_PAYLOAD["password"],
        })

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["message"] == "Login successful"
        assert data["access_token"] is not None
        assert data["token_type"] == "bearer"

    def test_login_response_contains_correct_user_fields(self, db_session):
        client.post("/api/auth/signup", json=LEARNER_PAYLOAD)

        response = client.post("/api/auth/login", json={
            "email": LEARNER_PAYLOAD["email"],
            "password": LEARNER_PAYLOAD["password"],
        })

        user_data = response.json()["user"]
        assert user_data["email"] == LEARNER_PAYLOAD["email"]
        assert user_data["full_name"] == LEARNER_PAYLOAD["full_name"]
        assert user_data["role"] == LEARNER_PAYLOAD["role"]
        assert user_data["user_id"] is not None

    def test_login_token_contains_correct_claims(self, db_session):
        signup_resp = client.post("/api/auth/signup", json=LEARNER_PAYLOAD)
        user_id = signup_resp.json()["user_id"]

        response = client.post("/api/auth/login", json={
            "email": LEARNER_PAYLOAD["email"],
            "password": LEARNER_PAYLOAD["password"],
        })

        payload = decode_access_token(response.json()["access_token"])
        assert payload is not None
        assert payload["sub"] == user_id
        assert payload["email"] == LEARNER_PAYLOAD["email"]
        assert payload["role"] == LEARNER_PAYLOAD["role"]

    def test_login_user_not_found_returns_401(self, db_session):
        response = client.post("/api/auth/login", json={
            "email": "ghost@example.com",
            "password": "password123",
        })

        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid email or password"

    def test_login_wrong_password_returns_401(self, db_session):
        client.post("/api/auth/signup", json=LEARNER_PAYLOAD)

        response = client.post("/api/auth/login", json={
            "email": LEARNER_PAYLOAD["email"],
            "password": "wrongpassword",
        })

        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid email or password"

    def test_login_error_message_same_for_wrong_password_and_missing_user(self, db_session):
        """Error message must not reveal whether the email exists (anti-enumeration)."""
        client.post("/api/auth/signup", json=LEARNER_PAYLOAD)

        wrong_pass = client.post("/api/auth/login", json={
            "email": LEARNER_PAYLOAD["email"], "password": "wrongpassword"
        })
        not_found = client.post("/api/auth/login", json={
            "email": "ghost@example.com", "password": "password123"
        })

        assert wrong_pass.json()["detail"] == not_found.json()["detail"]

    # ── Validation (no DB needed) ─────────────────────────────────────────────

    def test_login_missing_email_returns_422(self):
        assert client.post("/api/auth/login", json={"password": "pass"}).status_code == 422

    def test_login_missing_password_returns_422(self):
        assert client.post("/api/auth/login", json={"email": "a@b.com"}).status_code == 422

    def test_login_empty_body_returns_422(self):
        assert client.post("/api/auth/login", json={}).status_code == 422


# ─── POST /api/auth/forgot-password ──────────────────────────────────────────

class TestForgotPassword:
    @patch("app.routes.authentication_route.send_forgot_password_email", new_callable=AsyncMock)
    def test_registered_email_returns_200(self, mock_send, db_session):
        client.post("/api/auth/signup", json=LEARNER_PAYLOAD)

        response = client.post("/api/auth/forgot-password", json={"email": LEARNER_PAYLOAD["email"]})

        assert response.status_code == 200
        assert response.json()["status"] == "success"
        assert response.json()["message"] == GENERIC_RESET_MESSAGE

    @patch("app.routes.authentication_route.send_forgot_password_email", new_callable=AsyncMock)
    def test_registered_email_sends_email_to_correct_recipient(self, mock_send, db_session):
        client.post("/api/auth/signup", json=LEARNER_PAYLOAD)

        client.post("/api/auth/forgot-password", json={"email": LEARNER_PAYLOAD["email"]})

        mock_send.assert_called_once()
        assert mock_send.call_args.kwargs["recipient_email"] == LEARNER_PAYLOAD["email"]
        assert mock_send.call_args.kwargs["full_name"] == LEARNER_PAYLOAD["full_name"]

    @patch("app.routes.authentication_route.send_forgot_password_email", new_callable=AsyncMock)
    def test_registered_email_creates_reset_record_in_db(self, mock_send, db_session):
        client.post("/api/auth/signup", json=LEARNER_PAYLOAD)

        client.post("/api/auth/forgot-password", json={"email": LEARNER_PAYLOAD["email"]})

        record = db_session.query(ForgotPasswordRequests)\
            .filter(ForgotPasswordRequests.user_email == LEARNER_PAYLOAD["email"])\
            .first()
        assert record is not None
        assert record.status == "pending"
        assert len(record.verification_code) == 6
        assert record.verification_code.isdigit()

    @patch("app.routes.authentication_route.send_forgot_password_email", new_callable=AsyncMock)
    def test_second_request_invalidates_first(self, mock_send, db_session):
        client.post("/api/auth/signup", json=LEARNER_PAYLOAD)

        client.post("/api/auth/forgot-password", json={"email": LEARNER_PAYLOAD["email"]})
        client.post("/api/auth/forgot-password", json={"email": LEARNER_PAYLOAD["email"]})

        records = db_session.query(ForgotPasswordRequests)\
            .filter(ForgotPasswordRequests.user_email == LEARNER_PAYLOAD["email"])\
            .all()

        statuses = [r.status for r in records]
        assert statuses.count("pending") == 1
        assert statuses.count("invalidated") == 1

    def test_unregistered_email_returns_200_with_generic_message(self, db_session):
        response = client.post("/api/auth/forgot-password", json={"email": "ghost@example.com"})

        assert response.status_code == 200
        assert response.json()["message"] == GENERIC_RESET_MESSAGE

    def test_unregistered_email_does_not_create_reset_record(self, db_session):
        client.post("/api/auth/forgot-password", json={"email": "ghost@example.com"})

        record = db_session.query(ForgotPasswordRequests)\
            .filter(ForgotPasswordRequests.user_email == "ghost@example.com")\
            .first()
        assert record is None

    @patch("app.routes.authentication_route.send_forgot_password_email", new_callable=AsyncMock)
    def test_unregistered_email_does_not_send_email(self, mock_send, db_session):
        client.post("/api/auth/forgot-password", json={"email": "ghost@example.com"})
        mock_send.assert_not_called()

    @patch("app.routes.authentication_route.send_forgot_password_email", new_callable=AsyncMock)
    def test_both_emails_return_identical_message(self, mock_send, db_session):
        """Anti-enumeration: registered and unregistered emails must look identical."""
        client.post("/api/auth/signup", json=LEARNER_PAYLOAD)

        registered = client.post("/api/auth/forgot-password", json={"email": LEARNER_PAYLOAD["email"]})
        unregistered = client.post("/api/auth/forgot-password", json={"email": "ghost@example.com"})

        assert registered.json()["message"] == unregistered.json()["message"]
        assert registered.status_code == unregistered.status_code

    # ── Validation ────────────────────────────────────────────────────────────

    def test_missing_email_field_returns_422(self):
        assert client.post("/api/auth/forgot-password", json={}).status_code == 422


# ─── POST /api/auth/reset-password ───────────────────────────────────────────

class TestResetPassword:
    def _setup_reset(self, db_session):
        """Creates a user, requests a password reset, and returns the OTP from the DB."""
        with patch(
            "app.routes.authentication_route.send_forgot_password_email",
            new_callable=AsyncMock,
        ):
            client.post("/api/auth/signup", json=LEARNER_PAYLOAD)
            client.post("/api/auth/forgot-password", json={"email": LEARNER_PAYLOAD["email"]})

        record = db_session.query(ForgotPasswordRequests)\
            .filter(ForgotPasswordRequests.user_email == LEARNER_PAYLOAD["email"])\
            .first()
        return record.verification_code

    def test_reset_password_success_returns_200(self, db_session):
        code = self._setup_reset(db_session)

        response = client.post("/api/auth/reset-password", json={
            "email": LEARNER_PAYLOAD["email"],
            "verification_code": code,
            "new_password": "newpassword123",
        })

        assert response.status_code == 200
        assert response.json()["status"] == "success"
        assert response.json()["message"] == "Password has been reset successfully"

    def test_reset_password_updates_password_in_db(self, db_session):
        code = self._setup_reset(db_session)

        client.post("/api/auth/reset-password", json={
            "email": LEARNER_PAYLOAD["email"],
            "verification_code": code,
            "new_password": "newpassword123",
        })

        user = db_session.query(User).filter(User.email == LEARNER_PAYLOAD["email"]).first()
        db_session.refresh(user)
        assert verify_password("newpassword123", user.password)
        assert not verify_password(LEARNER_PAYLOAD["password"], user.password)

    def test_reset_password_marks_request_as_processed(self, db_session):
        code = self._setup_reset(db_session)

        client.post("/api/auth/reset-password", json={
            "email": LEARNER_PAYLOAD["email"],
            "verification_code": code,
            "new_password": "newpassword123",
        })

        record = db_session.query(ForgotPasswordRequests)\
            .filter(ForgotPasswordRequests.user_email == LEARNER_PAYLOAD["email"])\
            .first()
        db_session.refresh(record)
        assert record.status == "processed"

    def test_reset_password_allows_login_with_new_password(self, db_session):
        """Full flow: signup → forgot → reset → login with new password."""
        code = self._setup_reset(db_session)

        client.post("/api/auth/reset-password", json={
            "email": LEARNER_PAYLOAD["email"],
            "verification_code": code,
            "new_password": "newpassword123",
        })

        login_response = client.post("/api/auth/login", json={
            "email": LEARNER_PAYLOAD["email"],
            "password": "newpassword123",
        })
        assert login_response.status_code == 200

    def test_reset_password_old_password_no_longer_works(self, db_session):
        """After reset, the old password must be rejected."""
        code = self._setup_reset(db_session)

        client.post("/api/auth/reset-password", json={
            "email": LEARNER_PAYLOAD["email"],
            "verification_code": code,
            "new_password": "newpassword123",
        })

        login_response = client.post("/api/auth/login", json={
            "email": LEARNER_PAYLOAD["email"],
            "password": LEARNER_PAYLOAD["password"],
        })
        assert login_response.status_code == 401

    def test_reset_password_invalid_code_returns_400(self, db_session):
        self._setup_reset(db_session)

        response = client.post("/api/auth/reset-password", json={
            "email": LEARNER_PAYLOAD["email"],
            "verification_code": "000000",
            "new_password": "newpassword123",
        })

        assert response.status_code == 400
        assert response.json()["detail"] == "Invalid or expired verification code"

    def test_reset_password_wrong_email_returns_400(self, db_session):
        code = self._setup_reset(db_session)

        response = client.post("/api/auth/reset-password", json={
            "email": "wrong@example.com",
            "verification_code": code,
            "new_password": "newpassword123",
        })

        assert response.status_code == 400
        assert response.json()["detail"] == "Invalid or expired verification code"

    def test_reset_password_code_cannot_be_reused(self, db_session):
        """A processed OTP must be rejected on second use."""
        code = self._setup_reset(db_session)

        client.post("/api/auth/reset-password", json={
            "email": LEARNER_PAYLOAD["email"],
            "verification_code": code,
            "new_password": "newpassword123",
        })
        second = client.post("/api/auth/reset-password", json={
            "email": LEARNER_PAYLOAD["email"],
            "verification_code": code,
            "new_password": "anotherpassword",
        })

        assert second.status_code == 400

    # ── Validation ────────────────────────────────────────────────────────────

    def test_reset_password_missing_email_returns_422(self):
        assert client.post("/api/auth/reset-password", json={
            "verification_code": "123456", "new_password": "pass"
        }).status_code == 422

    def test_reset_password_missing_code_returns_422(self):
        assert client.post("/api/auth/reset-password", json={
            "email": "a@b.com", "new_password": "pass"
        }).status_code == 422

    def test_reset_password_missing_new_password_returns_422(self):
        assert client.post("/api/auth/reset-password", json={
            "email": "a@b.com", "verification_code": "123456"
        }).status_code == 422

    def test_reset_password_empty_body_returns_422(self):
        assert client.post("/api/auth/reset-password", json={}).status_code == 422

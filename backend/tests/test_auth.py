import app.models
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient
from app.database import Base, get_db
from app.main import app
from app.services.auth_service import AuthService
from app.schemas.auth import SignUpRequest, LoginRequest

TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="module")
def auth_db():
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)

def test_signup_and_login_service(auth_db):
    signup_req = SignUpRequest(email="alex@example.com", password="password123", full_name="Alex Kumar")
    res = AuthService.register_user(auth_db, signup_req)

    assert res.access_token is not None
    assert res.user.email == "alex@example.com"
    assert res.user.full_name == "Alex Kumar"

    login_req = LoginRequest(email="alex@example.com", password="password123")
    res_login = AuthService.authenticate_user(auth_db, login_req)
    assert res_login.user.id == res.user.id

def test_auth_api_routes(auth_db):
    def override_get_db():
        try:
            yield auth_db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)

    # Signup route
    res_signup = client.post(
        "/api/auth/signup",
        json={"email": "newuser@example.com", "password": "password123", "full_name": "New User"}
    )
    assert res_signup.status_code == 200
    token = res_signup.json()["access_token"]

    # Login route
    res_login = client.post(
        "/api/auth/login",
        json={"email": "newuser@example.com", "password": "password123"}
    )
    assert res_login.status_code == 200

    # Me route
    res_me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res_me.status_code == 200
    assert res_me.json()["email"] == "newuser@example.com"

    app.dependency_overrides.clear()

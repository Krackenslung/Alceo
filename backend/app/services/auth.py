from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.errors import ApiError
from app.models import User

_hasher = PasswordHasher()
_TOKEN_SALT = "alceo-auth"


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password_hash: str, password: str) -> bool:
    try:
        return _hasher.verify(password_hash, password)
    except (VerifyMismatchError, InvalidHashError):
        return False


def issue_token(user_id: int, secret: str) -> str:
    return URLSafeTimedSerializer(secret, salt=_TOKEN_SALT).dumps({"uid": user_id})


def read_token(token: str, secret: str, max_age: int) -> int:
    try:
        data = URLSafeTimedSerializer(secret, salt=_TOKEN_SALT).loads(token, max_age=max_age)
    except SignatureExpired as exc:
        raise ApiError(401, "token_expired", "Session expired. Please log in again.") from exc
    except BadSignature as exc:
        raise ApiError(401, "invalid_token", "Invalid authentication token.") from exc
    return int(data["uid"])


def find_by_email(session: Session, email: str) -> User | None:
    return session.scalars(select(User).where(User.email == email.lower())).first()


def register(session: Session, name: str, email: str, password: str) -> User:
    if find_by_email(session, email) is not None:
        raise ApiError(409, "email_taken", "An account with this email already exists.")
    user = User(name=name, email=email.lower(), password_hash=hash_password(password))
    session.add(user)
    session.commit()
    return user


def _ensure_can_log_in(user: User) -> None:
    if user.status == "deleted":
        raise ApiError(401, "invalid_credentials", "Invalid email or password.")
    if user.status == "blocked":
        raise ApiError(403, "account_blocked", "This account is blocked.")


def login(session: Session, email: str, password: str) -> User:
    user = find_by_email(session, email)
    if user is None:
        raise ApiError(401, "invalid_credentials", "Invalid email or password.")
    if user.password_hash is None:
        raise ApiError(401, "google_account", "This account uses Google sign-in. Log in with Google.")
    if not verify_password(user.password_hash, password):
        raise ApiError(401, "invalid_credentials", "Invalid email or password.")
    _ensure_can_log_in(user)
    return user


def verify_google_token(token: str, client_id: str) -> dict:
    from google.auth.transport import requests as google_requests
    from google.oauth2 import id_token

    try:
        return id_token.verify_oauth2_token(token, google_requests.Request(), client_id)
    except ValueError as exc:
        raise ApiError(401, "invalid_google_token", "Google sign-in failed.") from exc


def google_login(session: Session, claims: dict) -> User:
    email = claims.get("email")
    if not email or not claims.get("email_verified"):
        raise ApiError(401, "invalid_google_token", "Google account has no verified email.")
    user = find_by_email(session, email)
    if user is None:
        name = (claims.get("name") or email.split("@")[0])[:100]
        user = User(name=name, email=email.lower(), password_hash=None)
        session.add(user)
        session.commit()
    _ensure_can_log_in(user)
    return user

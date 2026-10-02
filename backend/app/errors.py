import logging

from flask import Flask, Response, jsonify
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError
from werkzeug.exceptions import HTTPException

from app.db import get_session

logger = logging.getLogger(__name__)


class ApiError(Exception):
    def __init__(self, status: int, code: str, message: str) -> None:
        super().__init__(message)
        self.status = status
        self.code = code
        self.message = message


def error_response(status: int, code: str, message: str) -> tuple[Response, int]:
    return jsonify({"error": {"code": code, "message": message}}), status


def _validation_message(exc: ValidationError) -> str:
    parts = []
    for err in exc.errors():
        loc = ".".join(str(p) for p in err["loc"])
        parts.append(f"{loc}: {err['msg']}" if loc else err["msg"])
    return "; ".join(parts)


def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(ApiError)
    def _api_error(exc: ApiError):
        return error_response(exc.status, exc.code, exc.message)

    @app.errorhandler(ValidationError)
    def _validation_error(exc: ValidationError):
        return error_response(400, "validation_error", _validation_message(exc))

    @app.errorhandler(IntegrityError)
    def _integrity_error(exc: IntegrityError):
        get_session().rollback()
        logger.info("Integrity error: %s", exc.orig)
        return error_response(409, "conflict", "The request conflicts with existing data or a database constraint.")

    @app.errorhandler(HTTPException)
    def _http_error(exc: HTTPException):
        code = (exc.name or "error").lower().replace(" ", "_")
        return error_response(exc.code or 500, code, exc.description or exc.name)

    @app.errorhandler(Exception)
    def _unexpected(exc: Exception):
        logger.exception("Unhandled error")
        return error_response(500, "internal_error", "Unexpected server error.")

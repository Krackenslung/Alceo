from typing import TypeVar

from flask import request
from pydantic import BaseModel

from app.errors import ApiError

M = TypeVar("M", bound=BaseModel)


def parse_body(model: type[M]) -> M:
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise ApiError(400, "invalid_json", "Request body must be a JSON object.")
    return model.model_validate(data)


def query_flag(name: str) -> bool:
    return request.args.get(name, "").lower() in ("1", "true", "yes")

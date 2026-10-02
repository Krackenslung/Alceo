from types import SimpleNamespace

import pytest
from google import genai
from google.genai import errors

from app.schemas.ai import AiResponseError
from app.services import ai as ai_service


def _error(code: int) -> errors.APIError:
    return errors.APIError(code, {"error": {"code": code, "message": "busy", "status": "UNAVAILABLE"}})


def _fake_client(monkeypatch, outcomes: list) -> list:
    calls = []

    def generate_content(**_kwargs):
        calls.append(1)
        outcome = outcomes.pop(0)
        if isinstance(outcome, Exception):
            raise outcome
        return SimpleNamespace(text=outcome)

    monkeypatch.setattr(genai, "Client", lambda api_key: SimpleNamespace(models=SimpleNamespace(generate_content=generate_content)))
    return calls


def test_retries_on_overload_then_succeeds(monkeypatch) -> None:
    calls = _fake_client(monkeypatch, [_error(503), _error(500), '{"ok": true}'])
    slept: list[float] = []
    assert ai_service.call_gemini("s", "u", "m", "k", sleep=slept.append) == '{"ok": true}'
    assert len(calls) == 3
    assert slept == list(ai_service.RETRY_DELAYS_SECONDS)


def test_gives_friendly_error_after_retries(monkeypatch) -> None:
    calls = _fake_client(monkeypatch, [_error(503), _error(503), _error(503)])
    with pytest.raises(AiResponseError, match="busy right now"):
        ai_service.call_gemini("s", "u", "m", "k", sleep=lambda _s: None)
    assert len(calls) == 3


def test_does_not_retry_client_errors(monkeypatch) -> None:
    calls = _fake_client(monkeypatch, [_error(404)])
    with pytest.raises(errors.APIError):
        ai_service.call_gemini("s", "u", "m", "k", sleep=lambda _s: None)
    assert len(calls) == 1


def test_rate_limit_fails_immediately_with_googles_own_message(monkeypatch) -> None:
    quota_error = errors.APIError(
        429,
        {"error": {"code": 429, "status": "RESOURCE_EXHAUSTED", "message": "Quota exceeded. Please retry in 24m53s."}},
    )
    calls = _fake_client(monkeypatch, [quota_error])
    slept: list[float] = []
    with pytest.raises(AiResponseError, match="retry in 24m53s"):
        ai_service.call_gemini("s", "u", "m", "k", sleep=slept.append)
    assert len(calls) == 1
    assert slept == []

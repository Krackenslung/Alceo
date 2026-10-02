import json
from datetime import date

from app.models import AiQuery, User, Workout
from app.services import ai as ai_service
from tests.conftest import auth_header


# --- auth ---


def test_register_login_and_me(client) -> None:
    res = client.post("/api/auth/register", json={"name": "Ana", "email": "Ana@Example.com", "password": "secret123"})
    assert res.status_code == 201
    body = res.get_json()
    assert body["user"]["email"] == "ana@example.com"
    assert body["user"]["status"] == "onboarding"
    assert "password_hash" not in body["user"]

    res = client.post("/api/auth/login", json={"email": "ana@example.com", "password": "secret123"})
    assert res.status_code == 200
    token = res.get_json()["token"]
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.get_json()["name"] == "Ana"


def test_wrong_password_and_duplicate_email(client, alice) -> None:
    res = client.post("/api/auth/login", json={"email": alice.email, "password": "nope-nope"})
    assert res.status_code == 401
    assert res.get_json()["error"]["code"] == "invalid_credentials"
    res = client.post("/api/auth/register", json={"name": "A", "email": alice.email, "password": "password123"})
    assert res.status_code == 409


def test_google_only_account_cannot_password_login(client, session) -> None:
    session.add(User(name="G", email="g@example.com", password_hash=None))
    session.commit()
    res = client.post("/api/auth/login", json={"email": "g@example.com", "password": "whatever1"})
    assert res.status_code == 401
    assert res.get_json()["error"]["code"] == "google_account"


def test_requires_token(client) -> None:
    res = client.get("/api/workouts")
    assert res.status_code == 401
    assert res.get_json() == {"error": {"code": "unauthorized", "message": "Missing bearer token."}}


# --- onboarding / age gate ---


def test_onboarding_activates_or_blocks(client, session) -> None:
    token = client.post(
        "/api/auth/register", json={"name": "Kid", "email": "kid@example.com", "password": "password123"}
    ).get_json()["token"]
    h = {"Authorization": f"Bearer {token}"}
    res = client.post("/api/users/me/complete-onboarding", headers=h)
    assert res.status_code == 400

    young = date.today().replace(year=date.today().year - 12).isoformat()
    res = client.patch(
        "/api/users/me",
        headers=h,
        json={"sex": "female", "date_of_birth": young, "height_cm": 150, "weight_kg": 40},
    )
    assert res.get_json()["status"] == "blocked"
    assert client.get("/api/workouts", headers=h).status_code == 403


def test_onboarding_success(client, session) -> None:
    token = client.post(
        "/api/auth/register", json={"name": "Max", "email": "max@example.com", "password": "password123"}
    ).get_json()["token"]
    h = {"Authorization": f"Bearer {token}"}
    client.patch(
        "/api/users/me",
        headers=h,
        json={"sex": "male", "date_of_birth": "1990-01-01", "height_cm": 180.5, "weight_kg": 82.3},
    )
    res = client.post("/api/users/me/complete-onboarding", headers=h)
    assert res.get_json()["status"] == "active"
    assert res.get_json()["height_cm"] == 180.5


# --- filters ---


def test_equipment_filter_vocabulary(client, alice) -> None:
    h = auth_header(alice)
    ok = client.post("/api/filters", headers=h, json={"filter_type": "equipment", "description": "Dumbbell"})
    assert ok.status_code == 201
    assert ok.get_json()["description"] == "dumbbell"
    bad = client.post("/api/filters", headers=h, json={"filter_type": "equipment", "description": "smith machine"})
    assert bad.status_code == 400


def test_filter_soft_delete_and_cross_user(client, alice, bob) -> None:
    fid = client.post(
        "/api/filters", headers=auth_header(alice), json={"filter_type": "injury", "description": "left knee"}
    ).get_json()["id"]
    assert client.get(f"/api/filters/{fid}", headers=auth_header(bob)).status_code == 404
    assert client.delete(f"/api/filters/{fid}", headers=auth_header(bob)).status_code == 404
    assert client.delete(f"/api/filters/{fid}", headers=auth_header(alice)).status_code == 204
    assert client.get("/api/filters", headers=auth_header(alice)).get_json() == []
    all_items = client.get("/api/filters?include_inactive=1", headers=auth_header(alice)).get_json()
    assert all_items[0]["is_active"] is False


# --- workouts ---


def _create_workout(client, user, exercises) -> dict:
    res = client.post(
        "/api/workouts",
        headers=auth_header(user),
        json={
            "name": "Legs",
            "exercises": [
                {"exercise_id": exercises[0].id, "sets": [{"reps": 10, "weight_kg": 40, "is_warmup": True}, {"reps": 5, "weight_kg": 100, "rpe": 8}]},
                {"exercise_id": exercises[1].id, "sets": [{"reps": 20}]},
                {"exercise_id": exercises[2].id},
            ],
        },
    )
    assert res.status_code == 201, res.get_json()
    return res.get_json()


def test_create_and_cross_user_access(client, alice, bob, exercises) -> None:
    w = _create_workout(client, alice, exercises)
    assert w["ai_query_id"] is None
    assert [e["sort_order"] for e in w["exercises"]] == [1, 2, 3]
    assert [s["set_number"] for s in w["exercises"][0]["sets"]] == [1, 2]
    assert w["exercises"][0]["sets"][0]["is_warmup"] is True
    assert client.get(f"/api/workouts/{w['id']}", headers=auth_header(bob)).status_code == 404
    assert client.patch(f"/api/workouts/{w['id']}", headers=auth_header(bob), json={"name": "x"}).status_code == 404
    assert client.get("/api/workouts", headers=auth_header(bob)).get_json() == []


def test_rpe_out_of_range_rejected_by_api(client, alice, exercises) -> None:
    w = _create_workout(client, alice, exercises)
    we_id = w["exercises"][0]["id"]
    res = client.post(f"/api/workouts/{w['id']}/exercises/{we_id}/sets", headers=auth_header(alice), json={"rpe": 10.5})
    assert res.status_code == 400
    assert res.get_json()["error"]["code"] == "validation_error"


def test_reorder_remove_and_renumber(client, alice, exercises) -> None:
    w = _create_workout(client, alice, exercises)
    ids = [e["id"] for e in w["exercises"]]
    h = auth_header(alice)
    res = client.put(f"/api/workouts/{w['id']}/exercises/order", headers=h, json={"workout_exercise_ids": ids[::-1]})
    assert res.status_code == 200
    assert [e["id"] for e in res.get_json()["exercises"]] == ids[::-1]
    assert [e["sort_order"] for e in res.get_json()["exercises"]] == [1, 2, 3]

    res = client.delete(f"/api/workouts/{w['id']}/exercises/{ids[1]}", headers=h)
    assert [e["sort_order"] for e in res.get_json()["exercises"]] == [1, 2]

    bad = client.put(f"/api/workouts/{w['id']}/exercises/order", headers=h, json={"workout_exercise_ids": [ids[0]]})
    assert bad.status_code == 400


def test_delete_set_renumbers(client, alice, exercises) -> None:
    w = _create_workout(client, alice, exercises)
    h = auth_header(alice)
    first_set = w["exercises"][0]["sets"][0]["id"]
    assert client.delete(f"/api/workouts/{w['id']}/sets/{first_set}", headers=h).status_code == 204
    sets = client.get(f"/api/workouts/{w['id']}", headers=h).get_json()["exercises"][0]["sets"]
    assert [s["set_number"] for s in sets] == [1]


def test_status_transitions(client, alice, exercises) -> None:
    w = _create_workout(client, alice, exercises)
    h = auth_header(alice)
    assert client.post(f"/api/workouts/{w['id']}/finish", headers=h).status_code == 409
    started = client.post(f"/api/workouts/{w['id']}/start", headers=h).get_json()
    assert started["status"] == "in_progress" and started["started_at"].endswith("Z")
    assert started["finished_at"] is None
    done = client.post(f"/api/workouts/{w['id']}/finish", headers=h).get_json()
    assert done["status"] == "completed" and done["finished_at"] >= done["started_at"]
    assert client.patch(f"/api/workouts/{w['id']}/sets/{w['exercises'][0]['sets'][0]['id']}", headers=h, json={"reps": 1}).status_code == 409
    assert client.delete(f"/api/workouts/{w['id']}", headers=h).status_code == 409


def test_custom_exercise_and_soft_delete(client, alice, bob) -> None:
    h = auth_header(alice)
    ex = client.post("/api/exercises", headers=h, json={"name": "Zercher Squat", "category": "strength", "equipment": "barbell"})
    assert ex.status_code == 201
    ex_id = ex.get_json()["id"]
    assert client.get(f"/api/exercises/{ex_id}", headers=auth_header(bob)).status_code == 404
    assert client.delete(f"/api/exercises/{ex_id}", headers=h).status_code == 204
    assert all(e["id"] != ex_id for e in client.get("/api/exercises", headers=h).get_json())
    dup = client.post("/api/exercises", headers=h, json={"name": "zercher squat", "category": "strength"})
    assert dup.status_code == 409


# --- AI ---


def _fake_reply(*names: str) -> str:
    return json.dumps(
        {
            "name": "AI Legs",
            "notes": "Go easy",
            "exercises": [
                {"name": n, "equipment": None, "sets": [{"reps": 10, "weight_kg": 20, "rpe": 5, "is_warmup": True}, {"reps": 5, "weight_kg": 60.5, "rpe": 7.5}]}
                for n in names
            ],
        }
    )


def test_ai_success_creates_planned_workout(client, session, alice, exercises, monkeypatch) -> None:
    seen = {}

    def fake(system_prompt, user_prompt, model, api_key):
        seen["system"], seen["user"] = system_prompt, user_prompt
        return _fake_reply("back squat", "Push-Up")

    monkeypatch.setattr(ai_service, "call_gemini", fake)
    h = auth_header(alice)
    client.post("/api/filters", headers=h, json={"filter_type": "injury", "description": "left shoulder"})
    off = client.post("/api/filters", headers=h, json={"filter_type": "sport", "description": "tennis"}).get_json()
    client.delete(f"/api/filters/{off['id']}", headers=h)

    res = client.post("/api/ai/workouts", headers=h, json={"request": "legs today"})
    assert res.status_code == 201, res.get_json()
    w = res.get_json()
    assert w["status"] == "planned" and w["ai_query_id"] is not None
    assert [e["exercise_name"] for e in w["exercises"]] == ["Back Squat", "Push-Up"]
    assert "left shoulder" in seen["user"] and "tennis" not in seen["user"]

    q = client.get(f"/api/ai/queries/{w['ai_query_id']}", headers=h).get_json()
    assert q["status"] == "success" and q["response"]["name"] == "AI Legs"
    assert client.get(f"/api/ai/queries/{w['ai_query_id']}", headers=auth_header(_other(session))).status_code == 404


def _other(session) -> User:
    u = User(name="Other", email="other@example.com", password_hash=None, status="active")
    session.add(u)
    session.commit()
    return u


def test_ai_unknown_exercise_records_error_and_no_workout(client, session, alice, exercises, monkeypatch) -> None:
    fake = lambda *_: _fake_reply("Back Squat", "Bulgarian Split Squat")  # noqa: E731
    monkeypatch.setattr(ai_service, "call_gemini", fake)
    res = client.post("/api/ai/workouts", headers=auth_header(alice), json={})
    assert res.status_code == 502
    assert res.get_json()["error"]["code"] == "ai_failed"
    session.expire_all()
    q = session.query(AiQuery).one()
    assert q.status == "error" and q.response is None and "unknown exercise" in q.error_message
    assert session.query(Workout).count() == 0


def test_ai_invalid_json_and_exception(client, session, alice, exercises, monkeypatch) -> None:
    monkeypatch.setattr(ai_service, "call_gemini", lambda *_: "not json")
    assert client.post("/api/ai/workouts", headers=auth_header(alice), json={}).status_code == 502

    def boom(*_):
        raise RuntimeError("network down")

    monkeypatch.setattr(ai_service, "call_gemini", boom)
    assert client.post("/api/ai/workouts", headers=auth_header(alice), json={}).status_code == 502
    session.expire_all()
    assert [q.status for q in session.query(AiQuery).all()] == ["error", "error"]
    assert session.query(Workout).count() == 0


def test_ai_respects_equipment_filter(client, alice, exercises, monkeypatch) -> None:
    seen = {}

    def fake(system_prompt, user_prompt, model, api_key):
        seen["user"] = user_prompt
        return _fake_reply("Back Squat")

    monkeypatch.setattr(ai_service, "call_gemini", fake)
    h = auth_header(alice)
    client.post("/api/filters", headers=h, json={"filter_type": "equipment", "description": "bodyweight"})
    res = client.post("/api/ai/workouts", headers=h, json={})
    assert res.status_code == 502
    assert "Back Squat" not in seen["user"] and "Push-Up" in seen["user"]

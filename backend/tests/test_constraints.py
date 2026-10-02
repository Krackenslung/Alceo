from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Workout, WorkoutExercise, WorkoutSet


def _workout(session: Session, user_id: int, **kwargs) -> Workout:
    w = Workout(user_id=user_id, status=kwargs.pop("status", "planned"), **kwargs)
    session.add(w)
    session.flush()
    return w


def test_rpe_out_of_range_rejected_by_db(session, alice, exercises) -> None:
    w = _workout(session, alice.id)
    we = WorkoutExercise(workout_id=w.id, exercise_id=exercises[0].id, sort_order=1)
    session.add(we)
    session.flush()
    session.add(WorkoutSet(workout_exercise_id=we.id, set_number=1, rpe=11))
    with pytest.raises(IntegrityError):
        session.flush()


def test_finished_before_started_rejected_by_db(session, alice) -> None:
    now = datetime.now(timezone.utc)
    with pytest.raises(IntegrityError):
        _workout(session, alice.id, status="completed", started_at=now, finished_at=now - timedelta(hours=1))


def test_duplicate_sort_order_rejected_by_db(session, alice, exercises) -> None:
    w = _workout(session, alice.id)
    session.add(WorkoutExercise(workout_id=w.id, exercise_id=exercises[0].id, sort_order=1))
    session.add(WorkoutExercise(workout_id=w.id, exercise_id=exercises[1].id, sort_order=1))
    with pytest.raises(IntegrityError):
        session.flush()


def test_bad_status_rejected_by_db(session, alice) -> None:
    with pytest.raises(IntegrityError):
        _workout(session, alice.id, status="done")

from flask import Blueprint, jsonify

from app.auth import current_user, login_required
from app.db import get_session
from app.routes._helpers import parse_body, query_flag
from app.schemas.requests import FilterIn, FilterUpdateIn
from app.schemas.serializers import filter_to_dict
from app.services import filters as filters_service

bp = Blueprint("filters", __name__)


@bp.get("")
@login_required
def list_filters():
    items = filters_service.list_filters(get_session(), current_user().id, query_flag("include_inactive"))
    return jsonify([filter_to_dict(f) for f in items])


@bp.post("")
@login_required
def create_filter():
    item = filters_service.create_filter(get_session(), current_user().id, parse_body(FilterIn))
    return jsonify(filter_to_dict(item)), 201


@bp.get("/<int:filter_id>")
@login_required
def get_filter(filter_id: int):
    return jsonify(filter_to_dict(filters_service.get_filter(get_session(), current_user().id, filter_id)))


@bp.patch("/<int:filter_id>")
@login_required
def update_filter(filter_id: int):
    changes = parse_body(FilterUpdateIn).model_dump(exclude_unset=True)
    item = filters_service.update_filter(get_session(), current_user().id, filter_id, changes)
    return jsonify(filter_to_dict(item))


@bp.delete("/<int:filter_id>")
@login_required
def delete_filter(filter_id: int):
    filters_service.deactivate_filter(get_session(), current_user().id, filter_id)
    return "", 204

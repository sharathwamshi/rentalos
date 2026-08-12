from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt, verify_jwt_in_request


def roles_required(*roles):
    """Restrict a route to one or more roles: @roles_required('admin', 'owner')"""

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            if claims.get("role") not in roles:
                return jsonify({"error": "You don't have permission to do that."}), 403
            return fn(*args, **kwargs)

        return wrapper

    return decorator

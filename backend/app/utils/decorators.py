from functools import wraps
from flask import jsonify, current_app
from flask_jwt_extended import get_jwt, verify_jwt_in_request


def roles_required(*roles):
    """Restrict a route to one or more roles: @roles_required('admin', 'owner')"""

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            user_role = claims.get("role")
            if user_role not in roles:
                # Debug info included in every environment for now, since a
                # role mismatch is otherwise invisible from the frontend --
                # it shows up directly in the Network tab's response body.
                current_app.logger.warning(
                    "403: token role=%r does not match required roles=%r for %s",
                    user_role, roles, fn.__name__,
                )
                return jsonify(
                    {
                        "error": "You don't have permission to do that.",
                        "your_role": user_role,
                        "required_roles": list(roles),
                    }
                ), 403
            return fn(*args, **kwargs)

        return wrapper

    return decorator

from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt
from app.models.user import User

def role_required(required_role):
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            # Check claims first (Optimized)
            role = claims.get("role")
            
            if role:
                 if role != required_role:
                     return jsonify(msg="Access forbidden: Insufficient permissions"), 403
            else:
                # Fallback to DB if claim missing (Legacy tokens)
                user_id = claims.get("sub")
                user = User.query.get(int(user_id))
                if not user or user.role != required_role:
                    return jsonify(msg="Access forbidden: Insufficient permissions"), 403
                
            return fn(*args, **kwargs)
        return decorator
    return wrapper

from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.notification import Notification
from flask_jwt_extended import jwt_required, get_jwt_identity

notifications_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')

@notifications_bp.route('/', methods=['GET'])
@jwt_required()
def get_notifications():
    current_user_id = get_jwt_identity()
    
    # Get unread first, then recent read ones, limit 10
    notifs = Notification.query.filter_by(user_id=current_user_id)\
        .order_by(Notification.is_read.asc(), Notification.created_at.desc())\
        .limit(10).all()
        
    results = []
    for n in notifs:
        results.append({
            "id": n.id,
            "message": n.message,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat()
        })
    return jsonify(results), 200

@notifications_bp.route('/<id>/read', methods=['PUT'])
@jwt_required()
def mark_read(id):
    current_user_id = get_jwt_identity()
    notif = Notification.query.get_or_404(id)
    
    if str(notif.user_id) != str(current_user_id):
        return jsonify({"msg": "Unauthorized"}), 403
        
    notif.is_read = True
    db.session.commit()
    return jsonify({"msg": "Marked as read"}), 200

# Helper function to create notification (internal use)
def create_notification(user_id, message):
    try:
        notif = Notification(user_id=user_id, message=message)
        db.session.add(notif)
        db.session.commit()
    except Exception as e:
        print(f"Failed to create notification: {e}")

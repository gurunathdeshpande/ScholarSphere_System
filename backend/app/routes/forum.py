from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.forum import ForumTopic, ForumReply
from app.models.user import User
from flask_jwt_extended import jwt_required, get_jwt_identity

forum_bp = Blueprint('forum', __name__, url_prefix='/api/forum')

@forum_bp.route('/topics', methods=['GET'])
def get_topics():
    category = request.args.get('category')
    query = ForumTopic.query
    if category and category != 'All':
        query = query.filter_by(category=category)
    
    topics = query.order_by(ForumTopic.created_at.desc()).all()
    
    results = []
    for t in topics:
        results.append({
            "id": t.id,
            "title": t.title,
            "category": t.category,
            "author": t.author.username,
            "preview": t.content[:100] + "..." if len(t.content) > 100 else t.content,
            "replies_count": len(t.replies),
            "created_at": t.created_at.isoformat()
        })
    return jsonify(results), 200

@forum_bp.route('/topic/<id>', methods=['GET'])
def get_topic(id):
    topic = ForumTopic.query.get_or_404(id)
    
    replies = []
    for r in topic.replies:
        replies.append({
            "id": r.id,
            "content": r.content,
            "author": r.author.username,
            "created_at": r.created_at.isoformat()
        })
        
    return jsonify({
        "id": topic.id,
        "title": topic.title,
        "content": topic.content,
        "category": topic.category,
        "author": topic.author.username,
        "created_at": topic.created_at.isoformat(),
        "replies": replies
    }), 200

@forum_bp.route('/topic', methods=['POST'])
@jwt_required()
def create_topic():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data.get('title') or not data.get('content'):
        return jsonify({"msg": "Title and Content are required"}), 400
        
    topic = ForumTopic(
        title=data['title'],
        content=data['content'],
        category=data.get('category', 'General'),
        author_id=int(current_user_id)
    )
    db.session.add(topic)
    db.session.commit()
    
    return jsonify({"msg": "Topic created", "id": topic.id}), 201

@forum_bp.route('/topic/<id>/reply', methods=['POST'])
@jwt_required()
def add_reply(id):
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data.get('content'):
        return jsonify({"msg": "Content is required"}), 400
        
    topic = ForumTopic.query.get_or_404(id)
    
    reply = ForumReply(
        content=data['content'],
        topic_id=topic.id,
        author_id=int(current_user_id)
    )
    db.session.add(reply)
    db.session.commit()
    
    # Notify Topic Author if replier is not author
    if topic.author_id != int(current_user_id):
        from app.routes.notifications import create_notification
        replier_name = User.query.get(int(current_user_id)).username
        create_notification(topic.author_id, f"{replier_name} replied to your topic '{topic.title}'.")
    
    return jsonify({"msg": "Reply added", "id": reply.id}), 201

from flask import Blueprint, request, jsonify
from datetime import datetime
from app.extensions import db
from app.models.collaboration import CollaborationRequest
from app.models.faculty import Faculty
from app.models.user import User
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.auth.decorators import role_required

collaboration_bp = Blueprint('collaboration', __name__, url_prefix='/api/collaboration')

@collaboration_bp.route('/request', methods=['POST'])
@role_required('student')
def send_request():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    data = request.get_json()
    faculty_id = data.get('faculty_id')
    project_interest = data.get('project_interest')
    message = data.get('message')

    if not faculty_id or not project_interest:
        return jsonify({"msg": "Faculty ID and Project Interest are required"}), 400

    faculty = Faculty.query.get(faculty_id)
    if not faculty:
        return jsonify({"msg": "Faculty not found"}), 404

    # Check if a pending request already exists
    existing_req = CollaborationRequest.query.filter_by(
        student_id=user.id, 
        faculty_id=faculty_id, 
        status='Pending'
    ).first()
    
    if existing_req:
        return jsonify({"msg": "You already have a pending request with this faculty member"}), 400

    new_req = CollaborationRequest(
        student_id=user.id,
        faculty_id=faculty_id,
        project_interest=project_interest,
        message=message
    )
    
    db.session.add(new_req)
    db.session.commit()

    return jsonify({"msg": "Request sent successfully", "id": new_req.id}), 201

@collaboration_bp.route('/faculty/requests', methods=['GET'])
@role_required('faculty')
def get_faculty_requests():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    # Ensure user is faculty and linked
    faculty = Faculty.query.filter_by(user_id=user.id).first()
    if not faculty:
        return jsonify({"msg": "Faculty profile not found"}), 404

    requests = CollaborationRequest.query.filter_by(faculty_id=faculty.id).order_by(CollaborationRequest.created_at.desc()).all()
    
    results = []
    for req in requests:
        results.append({
            "id": req.id,
            "student_name": req.student.username,
            "student_email": req.student.email,
            "project_interest": req.project_interest,
            "message": req.message,
            "status": req.status,
            "created_at": req.created_at.isoformat()
        })

    return jsonify(results), 200

@collaboration_bp.route('/faculty/availability', methods=['GET', 'PUT'])
@role_required('faculty')
def manage_availability():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    faculty = Faculty.query.filter_by(user_id=user.id).first()
    
    if not faculty:
        return jsonify({"msg": "Faculty profile not found"}), 404
        
    if request.method == 'GET':
        return jsonify({"is_available": faculty.is_available_for_collaboration}), 200
        
    if request.method == 'PUT':
        data = request.get_json()
        faculty.is_available_for_collaboration = data.get('is_available', True)
        db.session.commit()
        return jsonify({"msg": "Availability updated", "is_available": faculty.is_available_for_collaboration}), 200

@collaboration_bp.route('/student/requests', methods=['GET'])
@role_required('student')
def get_student_requests():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    requests = CollaborationRequest.query.filter_by(student_id=user.id).order_by(CollaborationRequest.created_at.desc()).all()
    
    results = []
    for req in requests:
        results.append({
            "id": req.id,
            "faculty_id": req.faculty_id,
            "faculty_name": req.faculty.name, # Accessing relationship
            "project_interest": req.project_interest,
            "message": req.message,
            "status": req.status,
            "created_at": req.created_at.isoformat()
        })

    return jsonify(results), 200

@collaboration_bp.route('/available-faculty', methods=['GET'])
@role_required('student')
def get_available_faculty():
    # Modified Query: Allow ALL faculty who are 'Available', even if not yet registered/linked.
    # This allows students to request collaboration with faculty who haven't claimed their profile yet.
    query = Faculty.query.filter(
        Faculty.is_available_for_collaboration == True
    )
    
    # Search Filter
    search_q = request.args.get('q')
    if search_q:
        search_filter = f"%{search_q}%"
        # Filter by Name OR Department (Case Insensitive)
        query = query.filter(
            (Faculty.name.ilike(search_filter)) | 
            (Faculty.department.ilike(search_filter))
        )
    
    available_faculty = query.all()
    
    results = []
    for fac in available_faculty:
        results.append({
            "id": fac.id,
            "name": fac.name,
            "department": fac.department,
            "user_id": fac.user_id, 
            "profile_image": fac.profile_image,
            "title": fac.title
        })
        
    return jsonify(results), 200

@collaboration_bp.route('/request/<id>', methods=['PUT'])
@role_required('faculty')
def update_request_status(id):
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    req = CollaborationRequest.query.get_or_404(id)
    
    # Ensure the logged-in user is the faculty member who received the request
    faculty = Faculty.query.filter_by(user_id=user.id).first()
    if not faculty or req.faculty_id != faculty.id:
        return jsonify({"msg": "Unauthorized"}), 403

    data = request.get_json()
    new_status = data.get('status')
    
    if new_status not in ['Accepted', 'Rejected']:
        return jsonify({"msg": "Invalid status"}), 400

    req.status = new_status
    db.session.commit()
    
    # Notify Student
    from app.routes.notifications import create_notification
    create_notification(req.student_id, f"Your collaboration request to {faculty.name} was {new_status}.")

    return jsonify({"msg": f"Request {new_status}"}), 200

# --- Chat Functionality ---

from app.models.collaboration import CollaborationMessage

@collaboration_bp.route('/<id>/messages', methods=['GET'])
@jwt_required()
def get_messages(id):
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    req = CollaborationRequest.query.get_or_404(id)
    
    # Check access: Must be the student or the faculty linked to the request
    is_student = (req.student_id == user.id)
    is_faculty = False
    if user.role == 'faculty':
        faculty_profile = Faculty.query.filter_by(user_id=user.id).first()
        if faculty_profile and faculty_profile.id == req.faculty_id:
            is_faculty = True
            
    if not is_student and not is_faculty:
        return jsonify({"msg": "Unauthorized"}), 403

    messages = CollaborationMessage.query.filter_by(request_id=id).order_by(CollaborationMessage.created_at.asc()).all()
    
    results = []
    # Add the initial request message as the first message? 
    # Or just return the chat messages. Let's return chat messages.
    # The initial message is stored in `req.message`. 
    # Frontend can display `req.message` as the header or first bubble.
    
    for msg in messages:
        results.append({
            "id": msg.id,
            "sender_id": msg.sender_id,
            "sender_name": msg.sender.username,
            "message": msg.message,
            "created_at": msg.created_at.isoformat(),
            "is_me": (msg.sender_id == user.id)
        })
        
    return jsonify(results), 200

@collaboration_bp.route('/<id>/reply', methods=['POST'])
@jwt_required()
def reply_to_request(id):
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    req = CollaborationRequest.query.get_or_404(id)
    
    # Check access
    is_student = (req.student_id == user.id)
    is_faculty = False
    faculty_profile = None
    
    if user.role == 'faculty':
        faculty_profile = Faculty.query.filter_by(user_id=user.id).first()
        if faculty_profile and faculty_profile.id == req.faculty_id:
            is_faculty = True

    if not is_student and not is_faculty:
        return jsonify({"msg": "Unauthorized"}), 403
        
    data = request.get_json()
    message_text = data.get('message')
    
    if not message_text:
        return jsonify({"msg": "Message is required"}), 400
        
    new_msg = CollaborationMessage(
        request_id=req.id,
        sender_id=user.id,
        message=message_text
    )
    db.session.add(new_msg)
    
    # Update Request Metadata
    req.last_message_at = datetime.utcnow()
    
    db.session.commit()
    
    # Notify Recipient
    from app.routes.notifications import create_notification
    recipient_id = req.student_id if is_faculty else faculty_profile.user_id if faculty_profile else None
    
    # If student is sender, recipient is faculty. Faculty user_id is in faculty_profile.user_id
    if is_student:
        # Need to find faculty user id
        fac = Faculty.query.get(req.faculty_id)
        if fac and fac.user_id:
             create_notification(fac.user_id, f"New reply from {user.username}: {message_text[:30]}...")
    else:
        # Faculty is sender, student is recipient
        create_notification(req.student_id, f"New reply from Prof. {faculty_profile.name}: {message_text[:30]}...")

    return jsonify({
        "msg": "Reply sent", 
        "data": {
            "id": new_msg.id,
            "sender_id": new_msg.sender_id,
            "sender_name": user.username,
            "message": new_msg.message,
            "created_at": new_msg.created_at.isoformat(),
            "is_me": True
        }
    }), 201

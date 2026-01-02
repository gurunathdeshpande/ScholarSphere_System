from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.verification import FacultyVerificationRequest
from app.models.faculty import Faculty
from app.models.user import User
from app.auth.decorators import role_required
import uuid

verification_bp = Blueprint('verification', __name__, url_prefix='/api/verification')

@verification_bp.route('/request', methods=['POST'])
def request_verification():
    data = request.get_json()
    email = data.get('email')
    
    # Validation
    if not email or not data.get('name') or not data.get('department'):
        return jsonify({"msg": "Missing fields"}), 400
        
    # Check duplicate
    if FacultyVerificationRequest.query.filter_by(email=email, status='Pending').first():
         return jsonify({"msg": "Request already pending"}), 400
         
    req = FacultyVerificationRequest(
        name=data.get('name'),
        email=email,
        department=data.get('department'),
        message=data.get('message', '')
    )
    db.session.add(req)
    db.session.commit()
    
    return jsonify({"msg": "Verification request submitted"}), 201

@verification_bp.route('/admin/requests', methods=['GET'])
@role_required('admin')
def get_requests():
    status_filter = request.args.get('status', 'Pending') # Default to Pending
    
    query = FacultyVerificationRequest.query
    if status_filter != 'All':
         query = query.filter_by(status=status_filter)
         
    reqs = query.order_by(FacultyVerificationRequest.created_at.desc()).all()
    results = [{
        "id": r.id,
        "name": r.name,
        "email": r.email,
        "department": r.department,
        "message": r.message,
        "status": r.status,
        "created_at": r.created_at.isoformat()
    } for r in reqs]
    return jsonify(results), 200

@verification_bp.route('/admin/requests/<id>/approve', methods=['POST'])
@role_required('admin')
def approve_request(id):
    req = FacultyVerificationRequest.query.get_or_404(id)
    
    # 1. Create Faculty Record
    # Generate UUID
    fid = str(uuid.uuid4())
    faculty = Faculty(
        id=fid,
        name=req.name,
        email=req.email,
        department=req.department,
        institution="Ramaiah Institute of Technology", # Default
        is_available_for_collaboration=True # Enable by default upon approval
    )
    db.session.add(faculty)
    
    # 2. Update Request Status
    req.status = 'Approved'
    
    db.session.commit()
    
    return jsonify({"msg": "Faculty Approved. They can now register.", "faculty_id": fid}), 200

@verification_bp.route('/admin/requests/<id>/reject', methods=['POST'])
@role_required('admin')
def reject_request(id):
    req = FacultyVerificationRequest.query.get_or_404(id)
    req.status = 'Rejected'
    db.session.commit()
    return jsonify({"msg": "Request rejected"}), 200

@verification_bp.route('/admin/requests/<id>', methods=['DELETE'])
@role_required('admin')
def delete_request(id):
    req = FacultyVerificationRequest.query.get_or_404(id)
    db.session.delete(req)
    db.session.commit()
    return jsonify({"msg": "Request deleted"}), 200

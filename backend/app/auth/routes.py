from flask import Blueprint, request, jsonify
from app.extensions import db, jwt
from app.models.user import User
from app.models.faculty import Faculty
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'student') # Default to student

    if not username or not email or not password:
        return jsonify({"msg": "Missing required fields"}), 400

    if role == 'admin':
         return jsonify({"msg": "Admin registration is restricted"}), 403

    # PRE-CHECK: If Faculty, verify existence in Institution Records FIRST
    faculty = None
    if role == 'faculty':
        faculty = Faculty.query.filter_by(email=email).first()
        if not faculty:
            return jsonify({
                 "msg": "Faculty Verification Failed", 
                 "code": "FACULTY_NOT_FOUND",
                 "detail": "Your email is not found in our institution records. Please request verification."
             }), 403

    # Check for existing user
    if User.query.filter_by(username=username).first() or User.query.filter_by(email=email).first():
        return jsonify({"msg": "User already exists"}), 400

    new_user = User(username=username, email=email, role=role)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()
    
    # Link Faculty if applicable
    if role == 'faculty' and faculty:
        faculty.user_id = new_user.id
        db.session.commit()
    else:
        # Student registration is open
        pass

    return jsonify({"msg": "User created successfully"}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    role = data.get('role') # Role is now MANDATORY

    if not role:
         return jsonify({"msg": "Please select a role"}), 400

    user = User.query.filter_by(username=username).first()

    # RBAC: Check if user exists, password matches, AND role matches
    if user and user.check_password(password):
        if user.role != role:
            # STRICT CHECK: Reject if role doesn't match
             return jsonify({"msg": f"Incorrect role selected. You are not a {role}."}), 403


    if user and user.check_password(password):
        # Fetch Faculty ID if applicable
        faculty_id = None
        if user.role == 'faculty':
            faculty = Faculty.query.filter_by(user_id=user.id).first()
            if faculty:
                faculty_id = faculty.id
        
        # Include Claims in Token
        additional_claims = {"role": user.role, "faculty_id": faculty_id}
        # Identity is ID
        access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
        
        return jsonify(
            access_token=access_token, 
            user={
                "id": user.id, 
                "username": user.username, 
                "email": user.email, 
                "role": user.role,
                "faculty_id": faculty_id
            }
        ), 200

    return jsonify({"msg": "Bad username or password"}), 401

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    if not user:
        return jsonify({"msg": "User not found"}), 404
    
    faculty = Faculty.query.filter_by(user_id=user.id).first()
    faculty_id = faculty.id if faculty else None

    return jsonify(
        id=user.id, 
        username=user.username, 
        email=user.email, 
        role=user.role, 
        faculty_id=faculty_id
    ), 200

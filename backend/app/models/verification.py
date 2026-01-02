from app.extensions import db
from datetime import datetime

class FacultyVerificationRequest(db.Model):
    __tablename__ = 'faculty_verification_requests'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True)
    department = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text)
    
    status = db.Column(db.String(20), default='Pending') # Pending, Approved, Rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<FacultyVerificationRequest {self.email}>'

from datetime import datetime
from app.extensions import db

class CollaborationRequest(db.Model):
    __tablename__ = 'collaboration_requests'

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    faculty_id = db.Column(db.String(36), db.ForeignKey('faculty.id'), nullable=False)
    
    project_interest = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='Pending') # Pending, Accepted, Rejected
    status = db.Column(db.String(20), default='Pending') # Pending, Accepted, Rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_message_at = db.Column(db.DateTime, default=datetime.utcnow) # For sorting inbox

    # Relationships
    student = db.relationship('User', backref='sent_requests')
    faculty = db.relationship('Faculty', backref='received_requests')

    def __repr__(self):
        return f'<CollaborationRequest {self.id}: {self.status}>'

class CollaborationMessage(db.Model):
    __tablename__ = 'collaboration_messages'

    id = db.Column(db.Integer, primary_key=True)
    request_id = db.Column(db.Integer, db.ForeignKey('collaboration_requests.id'), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    request = db.relationship('CollaborationRequest', backref=db.backref('messages', lazy=True, cascade="all, delete-orphan"))
    sender = db.relationship('User')

    def __repr__(self):
        return f'<Message {self.id} from {self.sender_id}>'

import uuid
from app.extensions import db

class Faculty(db.Model):
    __tablename__ = 'faculty'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(255), nullable=False)
    title = db.Column(db.String(255))
    department = db.Column(db.String(255))
    institution = db.Column(db.String(255))
    email = db.Column(db.String(255))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True) # Link to User account
    research_interests = db.Column(db.JSON)  # Storing array as JSON
    profile_image = db.Column(db.Text)
    citations = db.Column(db.Integer, default=0)
    h_index = db.Column(db.Integer, default=0)
    google_scholar_url = db.Column(db.String(255))
    orcid_id = db.Column(db.String(255))
    orcid_id = db.Column(db.String(255))
    irins_profile_url = db.Column(db.String(255))
    
    # Collaboration Availability (Strict Feature)
    is_available_for_collaboration = db.Column(db.Boolean, default=True)
    
    # Relationships
    publications = db.relationship('FacultyPublication', back_populates='faculty', cascade='all, delete-orphan')

    __table_args__ = (
        db.Index('idx_faculty_fulltext', 'name', 'department', 'institution', mysql_prefix='FULLTEXT'),
    )

    def __repr__(self):
        return f'<Faculty {self.name}>'

    @property
    def publication_list(self):
        """Returns a list of Publication objects from the association."""
        return [fp.publication for fp in self.publications if fp.publication]

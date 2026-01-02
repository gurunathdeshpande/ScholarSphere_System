import uuid
from app.extensions import db

class Publication(db.Model):
    __tablename__ = 'publications'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.Text, nullable=False)
    abstract = db.Column(db.Text)
    authors = db.Column(db.JSON) # List of author names (strings)
    journal = db.Column(db.String(255))
    year = db.Column(db.Integer)
    doi = db.Column(db.String(255))
    citations = db.Column(db.Integer, default=0)
    venue = db.Column(db.String(255))
    publisher = db.Column(db.String(255))
    research_domains = db.Column(db.JSON) # Added based on search.py usage
    
    # Relationships
    faculty_authors = db.relationship('FacultyPublication', back_populates='publication', cascade='all, delete-orphan')

    __table_args__ = (
        db.Index('idx_publication_fulltext', 'title', 'abstract', mysql_prefix='FULLTEXT'),
    )

    def __repr__(self):
        return f'<Publication {self.title[:50]}...>'

class FacultyPublication(db.Model):
    __tablename__ = 'faculty_publications'

    faculty_id = db.Column(db.String(36), db.ForeignKey('faculty.id'), primary_key=True)
    publication_id = db.Column(db.String(36), db.ForeignKey('publications.id'), primary_key=True)
    author_position = db.Column(db.Integer)
    is_corresponding = db.Column(db.Boolean, default=False)

    faculty = db.relationship('Faculty', back_populates='publications')
    publication = db.relationship('Publication', back_populates='faculty_authors')

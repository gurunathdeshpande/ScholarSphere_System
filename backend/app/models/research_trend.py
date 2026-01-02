import uuid
from app.extensions import db

class ResearchTrend(db.Model):
    __tablename__ = 'research_trends'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    topic = db.Column(db.String(255), nullable=False)
    category = db.Column(db.String(255))
    growth_rate = db.Column(db.Float)
    year = db.Column(db.Integer)
    quarter = db.Column(db.Integer)
    publication_count = db.Column(db.Integer)
    citation_count = db.Column(db.Integer)
    faculty_count = db.Column(db.Integer)
    trending_score = db.Column(db.Float)

    def __repr__(self):
        return f'<ResearchTrend {self.topic}>'

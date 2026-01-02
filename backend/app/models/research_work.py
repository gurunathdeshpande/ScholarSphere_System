import uuid
from app.extensions import db

class ResearchWork(db.Model):
    __tablename__ = 'research_works'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    researcher = db.Column(db.String(255), nullable=False)
    domain = db.Column(db.String(255))
    status = db.Column(db.String(50))
    keywords = db.Column(db.JSON)
    funding = db.Column(db.String(255))
    year = db.Column(db.Integer)
    citations = db.Column(db.Integer, default=0)

    __table_args__ = (
        db.Index('idx_research_work_fulltext', 'title', 'description', 'domain', mysql_prefix='FULLTEXT'),
    )

    def __repr__(self):
        return f'<ResearchWork {self.title}>'

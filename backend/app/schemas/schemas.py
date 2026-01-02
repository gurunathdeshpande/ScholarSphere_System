from app.extensions import ma
from app.models.faculty import Faculty
from app.models.publication import Publication, FacultyPublication
from app.models.research_work import ResearchWork
from app.models.research_trend import ResearchTrend
from marshmallow import fields

class FacultySchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Faculty
        load_instance = True
    
    publications = ma.Nested('PublicationSchema', many=True, exclude=('faculty_authors',), attribute='publication_list', dump_only=True)

class PublicationSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Publication
        load_instance = True
    
    faculty_authors = ma.Nested('FacultyPublicationSchema', many=True)

class FacultyPublicationSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = FacultyPublication
        load_instance = True
    
    faculty = ma.Nested('FacultySchema', exclude=('publications',))

class ResearchWorkSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = ResearchWork
        load_instance = True

class ResearchTrendSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = ResearchTrend
        load_instance = True

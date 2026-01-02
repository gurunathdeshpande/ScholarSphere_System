from app.app import create_app
from app.extensions import db
from app.models.faculty import Faculty
from app.models.publication import Publication
from app.models.publication import FacultyPublication
from app.models.research_work import ResearchWork

app = create_app()

def inspect_data():
    with app.app_context():
        f_count = Faculty.query.count()
        p_count = Publication.query.count()
        fp_count = FacultyPublication.query.count()
        rw_count = ResearchWork.query.count()
        
        print(f"Faculty: {f_count}")
        print(f"Publications: {p_count}")
        print(f"Faculty-Pub Links: {fp_count}")
        print(f"ResearchWorks: {rw_count}")
        
        # Check departments
        depts = db.session.query(Faculty.department, db.func.count(Faculty.id)).group_by(Faculty.department).all()
        print("\nDepartments:")
        for d, c in depts:
            print(f"- {d}: {c}")

if __name__ == "__main__":
    inspect_data()

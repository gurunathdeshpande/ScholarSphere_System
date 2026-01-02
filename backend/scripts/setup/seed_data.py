import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
import random
from app.app import create_app
from app.extensions import db
from app.models.faculty import Faculty
from app.models.publication import Publication, FacultyPublication
from app.models.research_work import ResearchWork
from app.models.user import User

app = create_app()

def seed_data():
    with app.app_context():
        print("Seeding realistic data...")
        
        # Departments
        depts = ['Computer Science', 'Electronics', 'Mechanical Eng', 'Civil Eng', 'Biotechnology']
        
        # Create some faculty
        faculties = []
        for i in range(25):
            dept = random.choice(depts)
            name = f"Dr. Faculty {i+1} ({dept[:3]})"
            f = Faculty.query.filter_by(name=name).first()
            if not f:
                f = Faculty(
                    name=name,
                    department=dept,
                    institution="Ramaiah Institute of Technology",
                    citations=random.randint(50, 2000),
                    h_index=random.randint(5, 40),
                    profile_image=f"https://ui-avatars.com/api/?name={name.replace(' ', '+')}&background=random&color=fff"
                )
                db.session.add(f)
                faculties.append(f)
            else:
                faculties.append(f)
        
        db.session.commit()
        
        # Create Publications and ResearchWork
        years = [2021, 2022, 2023, 2024, 2025]
        domains_map = {
            'Computer Science': ['AI', 'Cybersecurity', 'Cloud Computing', 'Data Science'],
            'Electronics': ['VLSI', 'Embedded Systems', 'IoT', 'Signal Processing'],
            'Mechanical Eng': ['Robotics', 'Thermodynamics', 'Materials', 'Automotive'],
            'Civil Eng': ['Structural', 'Geotech', 'Environmental'],
            'Biotechnology': ['Genetics', 'Bioinformatics', 'Molecular Bio']
        }

        for f in faculties:
            # Each faculty gets 5-15 pubs
            num_pubs = random.randint(5, 15)
            dept_domains = domains_map.get(f.department, ['General'])
            
            for _ in range(num_pubs):
                year = random.choice(years)
                domain = random.choice(dept_domains)
                title = f"Research on {domain} and {random.choice(['Optimization', 'Analysis', 'Development', 'Review'])} {random.randint(100,999)}"
                
                # Check if pub exists
                pub = Publication.query.filter_by(title=title).first()
                if not pub:
                    citations = random.randint(0, 100)
                    pub = Publication(
                        title=title,
                        year=year,
                        venue="IEEE/Springer Conference",
                        citations=citations,
                        research_domains=[domain]
                    )
                    db.session.add(pub)
                    db.session.commit()
                    
                    # Link
                    link = FacultyPublication(faculty_id=f.id, publication_id=pub.id)
                    db.session.add(link)
                    
                    # ResearchWork
                    rw = ResearchWork(
                        title=title,
                        description=f"Advanced study in {domain}",
                        researcher=f.name,
                        domain=domain,
                        year=year,
                        citations=citations
                    )
                    db.session.add(rw)
        
        db.session.commit()
        
        from app.services.analytics_service import calculate_research_trends
        calculate_research_trends()
        
        print("Seeding Complete. Analytics should now look rich.")

if __name__ == "__main__":
    seed_data()

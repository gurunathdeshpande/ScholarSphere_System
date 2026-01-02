import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from app.app import create_app
from app.extensions import db
from app.models.faculty import Faculty
from app.models.publication import Publication, FacultyPublication
from app.models.research_work import ResearchWork

app = create_app()

def clean_and_scrape():
    with app.app_context():
        print("WARNING: This will DELETE all faculty, publications, and research data.")
        # Confirmation skipped for script, assuming user ran it intentionally.
        
        try:
            # Delete in order of dependencies
            print("Cleaning database...")
            FacultyPublication.query.delete()
            ResearchWork.query.delete()
            Publication.query.delete()
            Faculty.query.delete()
            db.session.commit()
            print("Database cleaned.")
            
            print("\nTo populate REAL data, you must run the scraper.")
            print("1. Login as Admin in Postman (username: 'admin', password: 'admin123')")
            print("2. POST /api/faculty/scrape with the admin token.")
            print("   OR")
            print("   I can trigger it now via internal script if you wish, but the proper flow is via API.")
            print("   Triggering internal scraper function directly for convenience...")
            
            # Internal Trigger
            from app.services.scraper import IRINSScraper
            from app.ml.domain_classifier import DomainClassifier
            from app.routes.faculty import scrape_and_store_faculty_data
            
            # We need to run this in a thread or just call it synchronously?
            # It takes a long time. Synchronous for script is fine.
            scrape_and_store_faculty_data(app)
            
            print("Scraping triggered. Check logs for progress.")
        
        except Exception as e:
            print(f"Error: {e}")
            db.session.rollback()

if __name__ == "__main__":
    clean_and_scrape()

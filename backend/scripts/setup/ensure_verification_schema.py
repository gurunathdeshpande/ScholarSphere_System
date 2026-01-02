import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from app.app import create_app
from app.extensions import db
from app.models.verification import FacultyVerificationRequest

app = create_app()

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        print("Schema updated for verification requests.")

import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from app.app import create_app
from app.extensions import db
from app.models.collaboration import CollaborationMessage

app = create_app()

def update_schema_force():
    with app.app_context():
        # Force create tables if not exist
        # Double check schema
        print("Checking schema...")
        db.create_all()
        print("Schema ensured.")

if __name__ == "__main__":
    update_schema_force()

import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from app.app import create_app
from app.extensions import db
from app.models.collaboration import CollaborationMessage

app = create_app()

def update_schema():
    with app.app_context():
        # Create the new table
        print("Creating collaboration_messages table...")
        db.create_all() # This only creates tables that don't exist
        print("Schema updated.")

if __name__ == "__main__":
    update_schema()

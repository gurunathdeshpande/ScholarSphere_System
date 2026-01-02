import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from app.app import create_app
from app.extensions import db
from sqlalchemy import text

app = create_app()

def add_columns():
    with app.app_context():
        try:
            with db.engine.connect() as conn:
                conn.execute(text("ALTER TABLE faculty ADD COLUMN is_available_for_collaboration BOOLEAN DEFAULT TRUE"))
                print("Added is_available_for_collaboration to faculty")
        except Exception as e:
            print(f"Faculty Error (maybe exists): {e}")

        try:
            with db.engine.connect() as conn:
                conn.execute(text("ALTER TABLE collaboration_requests ADD COLUMN last_message_at DATETIME DEFAULT NOW()")) # MySQL uses NOW() or default
                # But creating col usually works without default for existing rows if nullable, but lets try.
                # Actually default in text() might be tricky.
                # Let's just add column.
        except Exception as e:
             # Try simpler syntax if above fails or if column exists
             pass

        try:
             with db.engine.connect() as conn:
                conn.execute(text("ALTER TABLE collaboration_requests ADD COLUMN last_message_at DATETIME"))
                print("Added last_message_at to collaboration_requests")
        except Exception as e:
            print(f"Request Error (maybe exists): {e}")
            
if __name__ == "__main__":
    add_columns()

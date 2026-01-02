import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from app.app import create_app
from app.extensions import db
from app.models.user import User

app = create_app()

def create_admin(username, email, password):
    with app.app_context():
        # Check if exists
        user = User.query.filter_by(username=username).first()
        if user:
            print(f"User {username} already exists. Updating role to 'admin'...")
            user.role = 'admin'
            user.set_password(password)
        else:
            print(f"Creating new admin user {username}...")
            user = User(username=username, email=email, role='admin')
            user.set_password(password)
            db.session.add(user)
        
        db.session.commit()
        print(f"Admin user {username} ready.")

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 4:
        print("Usage: python create_admin.py <username> <email> <password>")
        print("Using default: admin admin@scholarsphere.com admin123")
        create_admin("admin", "admin@scholarsphere.com", "admin123")
    else:
        create_admin(sys.argv[1], sys.argv[2], sys.argv[3])

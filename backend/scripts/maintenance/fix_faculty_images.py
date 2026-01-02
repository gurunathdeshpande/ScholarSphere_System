import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from app.app import create_app
from app.extensions import db
from app.models.faculty import Faculty

app = create_app()

def fix_images():
    with app.app_context():
        print("Checking for missing faculty images...")
        faculty_list = Faculty.query.all()
        updated_count = 0
        
        for fac in faculty_list:
            if not fac.profile_image:
                # Generate a nice avatar based on their name
                fac.profile_image = f"https://ui-avatars.com/api/?name={fac.name.replace(' ', '+')}&background=random&color=fff"
                updated_count += 1
        
        if updated_count > 0:
            db.session.commit()
            print(f"Updated {updated_count} faculty profiles with default avatars.")
        else:
            print("All faculty already have images.")

if __name__ == "__main__":
    fix_images()

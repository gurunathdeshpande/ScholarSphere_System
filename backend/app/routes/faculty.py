from flask import Blueprint, request, jsonify, current_app
from app.extensions import db
from app.models.faculty import Faculty
from app.models.publication import Publication, FacultyPublication
from app.models.user import User
from app.schemas.schemas import FacultySchema
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.scraper import IRINSScraper
from app.ml.domain_classifier import DomainClassifier
import threading
import logging
from app.auth.decorators import role_required

logger = logging.getLogger(__name__)

faculty_bp = Blueprint('faculty', __name__, url_prefix='/api/faculty')

# Global variable to track scraping progress
scraping_status = {
    "is_running": False,
    "total_faculty": 0,
    "processed_faculty": 0,
    "current_faculty": "",
    "error": None
}



@faculty_bp.route('/scrape', methods=['POST'])
@role_required('admin')
def scrape_faculty():
    global scraping_status
    
    if scraping_status["is_running"]:
        return jsonify({
            "message": "Scraping already in progress",
            "status": scraping_status
        }), 400
        
    try:
        scraping_status = {
            "is_running": True,
            "total_faculty": 0,
            "processed_faculty": 0,
            "current_faculty": "",
            "error": None
        }
        
        # Pass the real app object to the thread
        app = current_app._get_current_object()
        thread = threading.Thread(target=scrape_and_store_faculty_data, args=(app,))
        thread.start()
        
        return jsonify({"message": "Faculty scraping started successfully"}), 200
    except Exception as e:
        scraping_status["error"] = str(e)
        scraping_status["is_running"] = False
        return jsonify({"error": str(e)}), 500

@faculty_bp.route('/scrape/status', methods=['GET'])
@role_required('admin')
def get_scraping_status():
    return jsonify(scraping_status)

@faculty_bp.route('/scrape/stop', methods=['POST'])
@role_required('admin')
def stop_scraping():
    global scraping_status
    if scraping_status["is_running"]:
        scraping_status["is_running"] = False
        return jsonify({"message": "Scraper stopping... (it may take a moment to finish the current profile)"}), 200
    else:
        return jsonify({"message": "Scraper is not running"}), 400

# Public Search for Registration
@faculty_bp.route('/search-public', methods=['GET'])
def search_public_faculty():
    name = request.args.get('name')
    if not name or len(name) < 3:
        return jsonify([])
        
    results = Faculty.query.filter(Faculty.name.ilike(f"%{name}%")).limit(10).all()
    # Return minimal data for privacy/security
    data = [{
        "id": f.id,
        "name": f.name,
        "department": f.department,
        "email": f.email, # Need this to confirm match
        "institution": f.institution,
        "user_id": f.user_id # Important to show if already registered
    } for f in results]
    
    return jsonify(data), 200

@faculty_bp.route('', methods=['POST'])
@role_required('admin')
def create_faculty():
    data = request.get_json()
    schema = FacultySchema()
    try:
        faculty = schema.load(data)
        db.session.add(faculty)
        db.session.commit()
        return jsonify(schema.dump(faculty)), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@faculty_bp.route('/<id>', methods=['DELETE'])
@role_required('admin')
def delete_faculty(id):
    faculty = Faculty.query.get_or_404(id)
    db.session.delete(faculty)
    db.session.commit()
    return jsonify({"msg": "Faculty deleted"}), 200



def scrape_and_store_faculty_data(app):
    """Background task to scrape and store faculty data"""
    global scraping_status
    
    with app.app_context():
        try:
            # Initialize scraper and classifier
            scraper = IRINSScraper("https://msrit.irins.org/")
            classifier = DomainClassifier()
            
            # 1. Fetch Departments first
            soup = scraper.get_page(scraper.base_url)
            departments = scraper.extract_departments(soup)
            scraping_status["total_faculty"] = len(departments) * 10 # Estimate
            
            logger.info(f"Starting incremental scrape for {len(departments)} departments")
            
            # 2. Iterate and Save Incrementally
            total_processed = 0
            for dept in departments:
                if not scraping_status["is_running"]: 
                    logger.info("Scraping stopped by user request.")
                    break 
                    
                logger.info(f"Scraping Department: {dept['name']}")
                
                # Fetch faculty for this department
                faculty_list = scraper.extract_faculty_from_department(dept['url'], dept['name'])
                
                # Save THIS batch immediately
                for faculty_data in faculty_list:
                    # Granular Stop Check
                    if not scraping_status["is_running"]:
                        logger.info("Scraping stopped by user request (during faculty processing).")
                        break
                        
                    try:
                        total_processed += 1
                        scraping_status["processed_faculty"] = total_processed
                        scraping_status["current_faculty"] = faculty_data['name']
                        
                        # DataStore Logic (Moved inside loop)
                        faculty = Faculty.query.filter_by(name=faculty_data['name']).first()
                        if not faculty:
                            faculty = Faculty(name=faculty_data['name'])
                            db.session.add(faculty)
                            print(f"DEBUG: DataStore: Adding NEW faculty {faculty_data['name']}")
                        else:
                            print(f"DEBUG: DataStore: Updating faculty {faculty_data['name']}")
                        
                        faculty.department = faculty_data['department']
                        faculty.institution = "Ramaiah Institute of Technology"
                        if faculty_data.get('photo_url'):
                            faculty.profile_image = faculty_data['photo_url']
                        elif not faculty.profile_image: # Keep existing if validation fails, only set default if empty
                             faculty.profile_image = f"https://ui-avatars.com/api/?name={faculty_data['name'].replace(' ', '+')}&background=random&color=fff"
                        faculty.research_interests = faculty_data.get('research_interests', [])
                        faculty.citations = faculty_data.get('citations', 0)
                        faculty.h_index = faculty_data.get('h_index', 0)
                        faculty.irins_profile_url = faculty_data.get('profile_url')
                        
                        db.session.commit() # Commit PER FACULTY to be super safe and visible
                        print(f"DEBUG: DataStore: Committed {faculty_data['name']}")
                        
                        # Process publications
                        if 'publications' in faculty_data:
                            classified_pubs = classifier.batch_classify_publications(faculty_data['publications'])
                            for pub_data in classified_pubs:
                                pub = Publication.query.filter_by(title=pub_data['title']).first()
                                if not pub:
                                    pub = Publication(
                                        title=pub_data['title'],
                                        year=pub_data.get('year'),
                                        venue=pub_data.get('venue'),
                                        research_domains=pub_data.get('research_domains', ['Other'])
                                    )
                                    db.session.add(pub)
                                    db.session.commit()
                                
                                    # Link Faculty to Publication (Many-to-Many)
                                    link = FacultyPublication(faculty_id=faculty.id, publication_id=pub.id)
                                    db.session.add(link)
                                    db.session.commit()
                                    
                                # Create Research Work (Project/Trend) Entry for meaningful analytics
                                from app.models.research_work import ResearchWork
                                # Check if exists to avoid duplicates
                                if not ResearchWork.query.filter_by(title=pub.title).first():
                                    rw = ResearchWork(
                                        title=pub.title,
                                        description=f"Research output by {faculty.name} in {pub.year}",
                                        researcher=faculty.name,
                                        domain=pub.research_domains[0] if pub.research_domains else "General",
                                        status="Published",
                                        keywords=pub.research_domains,
                                        year=pub.year,
                                        citations=pub.citations
                                    )
                                    db.session.add(rw)
                                    db.session.commit()
                                    
                    except Exception as e:
                        logger.error(f"Error saving faculty {faculty_data.get('name')}: {e}")
                        db.session.rollback()
                        continue
                
                # Optional: Sleep to be nice to server
                import time
                time.sleep(1)
            
            # Update Analytics after ALL are done
            logger.info("Updating research trends...")
            calculate_research_trends()
            logger.info("Research trends updated.")

            scraping_status["is_running"] = False
            scraping_status["current_faculty"] = "Completed"
            
        except Exception as e:
            logger.error(f"Error in scrape_and_store_faculty_data: {str(e)}")
            scraping_status["error"] = str(e)
            scraping_status["is_running"] = False



@faculty_bp.route('', methods=['GET'])
def get_faculty_list():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 10, type=int)
    
    # Basic filtering
    department = request.args.get('department')
    institution = request.args.get('institution')
    
    query = Faculty.query
    
    if department:
        query = query.filter(Faculty.department.ilike(f'%{department}%'))
    if institution:
        query = query.filter(Faculty.institution.ilike(f'%{institution}%'))
        
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    schema = FacultySchema(many=True)
    return jsonify({
        'data': schema.dump(pagination.items),
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    })

@faculty_bp.route('/<id>', methods=['GET'])
def get_faculty(id):
    faculty = Faculty.query.get_or_404(id)
    schema = FacultySchema()
    return jsonify(schema.dump(faculty))



@faculty_bp.route('/<id>', methods=['PUT'])
@role_required('faculty')
def update_faculty(id):
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    faculty = Faculty.query.get_or_404(id)
    linked_faculty = Faculty.query.filter_by(user_id=user.id).first()
    
    if not linked_faculty or linked_faculty.id != faculty.id:
        return jsonify({"msg": "Unauthorized: You can only edit your own profile"}), 403

    data = request.get_json()
    schema = FacultySchema()
    try:
        # Update fields
        for key, value in data.items():
            if hasattr(faculty, key):
                setattr(faculty, key, value)
        
        db.session.commit()
        return jsonify(schema.dump(faculty))
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@faculty_bp.route('/publications/manual', methods=['POST'])
@role_required('faculty')
def create_manual_publication():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    # Check if user is faculty and linked
    faculty = Faculty.query.filter_by(user_id=user.id).first()
    if not faculty:
        return jsonify({"msg": "No linked faculty profile found"}), 404

    data = request.get_json()
    
    # Validate required fields
    if not data.get('title') or not data.get('year'):
        return jsonify({"msg": "Title and Year are required"}), 400

    try:
        # 1. Create Publication
        pub = Publication(
            title=data['title'],
            year=int(data['year']),
            venue=data.get('venue', 'Manual Entry'),
            abstract=data.get('abstract', ''),
            citations=0
        )
        db.session.add(pub)
        db.session.commit()

        # 2. Link to Faculty
        link = FacultyPublication(faculty_id=faculty.id, publication_id=pub.id)
        db.session.add(link)
        
        # 3. Create ResearchWork
        # Simple domain classification (or user provided)
        domain = data.get('domain', 'General')
        
        from app.models.research_work import ResearchWork
        rw = ResearchWork(
            title=pub.title,
            description=f"Research output by {faculty.name} in {pub.year}",
            researcher=faculty.name,
            domain=domain,
            status="Published",
            year=pub.year,
            citations=0
        )
        db.session.add(rw)
        
        db.session.commit()
        
        return jsonify({"msg": "Publication added successfully", "id": pub.id}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500



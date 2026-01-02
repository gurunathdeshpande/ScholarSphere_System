from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.faculty import Faculty
from app.models.publication import Publication
from app.models.research_work import ResearchWork
from app.schemas.schemas import FacultySchema, PublicationSchema, ResearchWorkSchema
from sqlalchemy import or_
from app.ml.domain_classifier import DomainClassifier

search_bp = Blueprint('search', __name__, url_prefix='/api/search')

@search_bp.route('/filter-options', methods=['GET'])
def get_filter_options():
    try:
        # Get unique departments
        departments = db.session.query(Faculty.department).distinct().all()
        departments = [d[0] for d in departments if d[0]]
        
        # Get unique institutions
        institutions = db.session.query(Faculty.institution).distinct().all()
        institutions = [i[0] for i in institutions if i[0]]
        
        # Get unique domains from classifier
        classifier = DomainClassifier()
        domains = classifier.research_domains
        
        return jsonify({
            "departments": sorted(departments),
            "institutions": sorted(institutions),
            "domains": sorted(domains)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@search_bp.route('/all', methods=['GET', 'POST'])
def search_all():
    if request.method == 'GET':
        query = request.args.get('q', '')
        limit = request.args.get('limit', 20, type=int)
        page = request.args.get('page', 1, type=int)
        sort_by = request.args.get('sort_by', 'relevance')
        sort_order = request.args.get('sort_order', 'desc')
        
        filters = {}
        if request.args.get('departments'):
            filters['departments'] = request.args.get('departments').split(',')
        if request.args.get('institutions'):
            filters['institutions'] = request.args.get('institutions').split(',')
        if request.args.get('domains'):
            filters['domains'] = request.args.get('domains').split(',')
        if request.args.get('year_min'):
            filters['year_min'] = request.args.get('year_min')
        if request.args.get('year_max'):
            filters['year_max'] = request.args.get('year_max')
    else:
        data = request.get_json()
        query = data.get('query', '')
        limit = data.get('limit', 20)
        page = data.get('page', 1)
        filters = data.get('filters', {})
        sort_by = data.get('sort_by', 'relevance')
        sort_order = data.get('sort_order', 'desc')
    
    # Base Queries
    faculty_q = Faculty.query
    pub_q = Publication.query
    research_q = ResearchWork.query

    # --- 1. Text Search ---
    if query:
        faculty_q = faculty_q.filter(
            or_(
                Faculty.name.like(f'%{query}%'),
                Faculty.department.like(f'%{query}%'),
                Faculty.institution.like(f'%{query}%')
            )
        )
        pub_q = pub_q.filter(
            or_(
                Publication.title.like(f'%{query}%'),
                Publication.abstract.like(f'%{query}%')
            )
        )
        research_q = research_q.filter(
            or_(
                ResearchWork.title.like(f'%{query}%'),
                ResearchWork.description.like(f'%{query}%'),
                ResearchWork.domain.like(f'%{query}%')
            )
        )

    # --- 2. Filters ---
    # Department Filter (Faculty only)
    if filters.get('departments'):
        faculty_q = faculty_q.filter(Faculty.department.in_(filters['departments']))
    
    # Institution Filter (Faculty only)
    if filters.get('institutions'):
        faculty_q = faculty_q.filter(Faculty.institution.in_(filters['institutions']))
    
    # Year Range Filter (Publications and Research)
    if filters.get('year_min'):
        pub_q = pub_q.filter(Publication.year >= filters['year_min'])
        research_q = research_q.filter(ResearchWork.year >= filters['year_min'])
    if filters.get('year_max'):
        pub_q = pub_q.filter(Publication.year <= filters['year_max'])
        research_q = research_q.filter(ResearchWork.year <= filters['year_max'])

    # Domain Filter (Research/Pubs - requires domain field or join)
    if filters.get('domains'):
        # For parity, we filter ResearchWork primarily
        domains = filters['domains']
        domain_filters = [ResearchWork.domain.like(f'%{d}%') for d in domains]
        research_q = research_q.filter(or_(*domain_filters))

    # --- 3. Sorting ---
    if sort_by == 'name':
        faculty_q = faculty_q.order_by(Faculty.name.asc() if sort_order == 'asc' else Faculty.name.desc())
        pub_q = pub_q.order_by(Publication.title.asc() if sort_order == 'asc' else Publication.title.desc())
        research_q = research_q.order_by(ResearchWork.title.asc() if sort_order == 'asc' else ResearchWork.title.desc())
    elif sort_by == 'year':
        # Faculty don't have year, so ignore or sort by id
        pub_q = pub_q.order_by(Publication.year.asc() if sort_order == 'asc' else Publication.year.desc())
        # ResearchWork created_at?
    elif sort_by == 'citations':
        faculty_q = faculty_q.order_by(Faculty.citations.asc() if sort_order == 'asc' else Faculty.citations.desc())
        pub_q = pub_q.order_by(Publication.citations.asc() if sort_order == 'asc' else Publication.citations.desc())
    
    # --- 4. Pagination ---
    # We paginate each independently for the tabs. 
    # In a unified view, this is tricky. We'll return full paginated objects for each type using the SAME page number.
    
    faculty_paginated = faculty_q.paginate(page=page, per_page=limit, error_out=False)
    pub_paginated = pub_q.paginate(page=page, per_page=limit, error_out=False)
    research_paginated = research_q.paginate(page=page, per_page=limit, error_out=False)

    faculty_schema = FacultySchema(many=True)
    pub_schema = PublicationSchema(many=True)
    research_schema = ResearchWorkSchema(many=True)
    
    return jsonify({
        "faculty": faculty_schema.dump(faculty_paginated.items),
        "publications": pub_schema.dump(pub_paginated.items),
        "research_works": research_schema.dump(research_paginated.items),
        "meta": {
            "page": page,
            "limit": limit,
            "total_faculty": faculty_paginated.total,
            "total_publications": pub_paginated.total,
            "total_research": research_paginated.total,
            "pages_faculty": faculty_paginated.pages,
            "pages_publications": pub_paginated.pages
        }
    })

@search_bp.route('/classify-domain', methods=['POST'])
def classify_domain():
    data = request.get_json()
    texts = data.get('texts', [])
    
    if not texts:
        return jsonify({"domains": []})
        
    classifier = DomainClassifier()
    results = []
    
    for text in texts:
        domains = classifier.classify_text(text)
        results.append({"text": text, "domains": domains})
        
    return jsonify({"results": results})

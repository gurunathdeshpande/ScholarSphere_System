from flask import Blueprint, request, jsonify
from app.models.research_trend import ResearchTrend
from app.models.publication import Publication, FacultyPublication
from app.models.faculty import Faculty
from app.models.research_work import ResearchWork
from app.schemas.schemas import ResearchTrendSchema
from app.extensions import db
from sqlalchemy import func, desc, distinct
from datetime import datetime, timedelta

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')

@analytics_bp.route('/trends', methods=['GET'])
def get_trends():
    limit = request.args.get('limit', 5, type=int)
    trends = ResearchTrend.query.order_by(ResearchTrend.trending_score.desc()).limit(limit).all()
    schema = ResearchTrendSchema(many=True)
    return jsonify(schema.dump(trends))

@analytics_bp.route('/research', methods=['GET'])
def get_research_analytics():
    try:
        # 1. Total Metrics
        total_faculty = Faculty.query.count()
        total_pubs = Publication.query.count()
        total_citations = db.session.query(func.sum(Publication.citations)).scalar() or 0
        
        # Calculate avg h-index (if we scraped it, otherwise mock reasonable number based on citations)
        # Using the actual h_index from Faculty table
        avg_h_index = db.session.query(func.avg(Faculty.h_index)).scalar() or 0
        
        # 2. Year-wise Research Output (Graph)
        # Aggregate from Publication table
        year_counts = db.session.query(
            Publication.year, 
            func.count(Publication.id).label('count'),
            func.sum(Publication.citations).label('cits')
        ).filter(Publication.year > 1990).group_by(Publication.year).order_by(Publication.year).all()
        
        publication_trends = [
            {'year': y, 'publications': c, 'citations': cit or 0} 
            for y, c, cit in year_counts
        ]
        
        # 3. Top Research Areas (from ResearchWork domains)
        from app.models.research_work import ResearchWork
        domain_counts = db.session.query(
            ResearchWork.domain, 
            func.count(ResearchWork.id).label('count')
        ).group_by(ResearchWork.domain).order_by(func.count(ResearchWork.id).desc()).limit(5).all()
        
        top_research_areas = [
            {'topic': d, 'growth_rate': 10 + i, 'trending_score': c} # Mock growth for parity or calc diff
            for i, (d, c) in enumerate(domain_counts)
        ]
        
        # 4. Department Stats
        dept_counts = db.session.query(
            Faculty.department,
            func.count(Faculty.id)
        ).group_by(Faculty.department).all()
        
        faculty_by_dept = [
            {'department': d, 'count': c, 'citations': 0} 
            for d, c in dept_counts if d
        ]

        # 5. Recent Activity
        recent_faculty = Faculty.query.order_by(Faculty.id.desc()).limit(5).all()
        recent_pubs = Publication.query.order_by(Publication.year.desc()).limit(5).all()
        
        from app.schemas.schemas import FacultySchema, PublicationSchema
        faculty_schema = FacultySchema(many=True)
        pub_schema = PublicationSchema(many=True)

        return jsonify({
            'metrics': {
                'totalFaculty': total_faculty,
                'totalPublications': total_pubs,
                'totalCitations': int(total_citations),
                'averageHIndex': round(avg_h_index, 1)
            },
            'publicationTrends': publication_trends,
            'topResearchAreas': top_research_areas,
            'facultyByDepartment': faculty_by_dept,
            'recentActivity': {
                'faculty': faculty_schema.dump(recent_faculty),
                'publications': pub_schema.dump(recent_pubs)
            }
        })

    except Exception as e:
        print(f"Error in analytics: {e}")
        return jsonify({"error": str(e)}), 500

@analytics_bp.route('/department', methods=['GET'])
def get_department_analytics():
    try:
        # Aggregate Faculty, Pubs, Citations by Department
        # 1. Faculty Count per Dept
        dept_faculty = db.session.query(
            Faculty.department, func.count(Faculty.id)
        ).group_by(Faculty.department).all()

        # 2. Citations & Pubs per Dept
        # We need to join Faculty -> Publication (via FacultyPublication)
        # But for simpler aggregation with our current schema:
        # Join Faculty -> ResearchWork (since RW has citations/domain) is easier?
        # Actually ResearchWork has 'researcher' name string, not FK.
        # Best path: Faculty -> FacultyPublication -> Publication
        
        from app.models.publication import FacultyPublication # Correct import
        
        dept_stats = []
        for dept, fac_count in dept_faculty:
            # Get faculty IDs in this dept
            faculty_ids = [f.id for f in Faculty.query.filter_by(department=dept).all()]
            
            if not faculty_ids:
                continue

            # Count Pubs and Citations for these faculty
            # Note: Distinct publications to avoid double counting if co-authored within same dept? 
            # For simplicity, we'll sum association entries or distinct pub ids
            
            stats = db.session.query(
                func.count(distinct(Publication.id)),
                func.sum(Publication.citations)
            ).join(FacultyPublication).filter(FacultyPublication.faculty_id.in_(faculty_ids)).first()
            
            pub_count = stats[0] or 0
            cite_count = stats[1] or 0
            
            if dept: # Filter out empty departments
                dept_stats.append({
                    "department": dept,
                    "faculty_count": fac_count,
                    "publication_count": pub_count,
                    "citations": cite_count,
                    # Impact factor proxy
                    "avg_citations": round(cite_count / pub_count, 2) if pub_count > 0 else 0
                })
        
        # Sort by citations desc
        dept_stats.sort(key=lambda x: x['citations'], reverse=True)
        
        return jsonify(dept_stats), 200

    except Exception as e:
        print(f"Error in dept analytics: {e}")
        return jsonify({"error": str(e)}), 500

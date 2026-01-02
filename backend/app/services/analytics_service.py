from app.extensions import db
from app.models.publication import Publication
from app.models.research_trend import ResearchTrend
from sqlalchemy import func
from datetime import datetime
import json

def calculate_research_trends():
    """
    Aggregates publication data to populate the ResearchTrend table.
    Should be called after scraping or periodically.
    """
    try:
        # Clear existing trends to avoid duplicates (or implementing updating logic)
        # For simplicity in this parity task, we'll wipe and rebuild for fresh stats
        db.session.query(ResearchTrend).delete()
        
        # 1. Aggregate publications by Domain and Year
        # We need to extract domains from the JSON or list column
        # Since 'research_domains' is stored differently depending on implementation (JSON or separate table),
        # let's assume it's a JSON column on Publication or we derived it.
        # Wait, looked at Publication model in step 441:
        # research_domains = db.Column(db.JSON)
        
        publications = Publication.query.all()
        
        trend_data = {} # { (topic, year): {count, citations} }
        
        for pub in publications:
            year = pub.year
            if not year:
                continue
                
            domains = pub.research_domains
            if isinstance(domains, str):
                try:
                    domains = json.loads(domains)
                except:
                    domains = []
            
            if not domains:
                domains = ["Uncategorized"]
                
            for domain in domains:
                key = (domain, year)
                if key not in trend_data:
                    trend_data[key] = {'count': 0, 'citations': 0}
                
                trend_data[key]['count'] += 1
                trend_data[key]['citations'] += (pub.citations or 0)
        
        # 2. Calculate Growth Rate and Score
        # Group by topic to compare years
        topic_stats = {}
        for (topic, year), stats in trend_data.items():
            if topic not in topic_stats:
                topic_stats[topic] = {}
            topic_stats[topic][year] = stats
            
        current_year = datetime.now().year
        
        for topic, years_map in topic_stats.items():
            # Calculate metrics for recent years
            total_pubs = sum(s['count'] for s in years_map.values())
            total_cites = sum(s['citations'] for s in years_map.values())
            
            # Simple growth rate: (Last Year - Year Before) / Year Before
            last_year_count = years_map.get(current_year - 1, {}).get('count', 0)
            prev_year_count = years_map.get(current_year - 2, {}).get('count', 0)
            
            growth_rate = 0.0
            if prev_year_count > 0:
                growth_rate = ((last_year_count - prev_year_count) / prev_year_count) * 100
            
            # Trending Score: Simple heuristic
            trending_score = (last_year_count * 2) + (growth_rate * 0.5) + (total_cites * 0.1)
            
            # Create Trend Record (one per topic for the dashbaord "Top Areas")
            # We can also store per-year records if needed for graphs
            
            # For "Top Research Areas" card:
            # Create Trend Record (one per topic for the dashboard "Top Areas" cards)
            # We will use category="Research Domain" for these summary cards.
            
            # 3. Calculate Growth Rate safe
            prev_year_count = years_map.get(current_year - 2, {}).get('count', 0)
            last_year_count = years_map.get(current_year - 1, {}).get('count', 0)
            
            growth_rate = 0.0
            if prev_year_count > 0:
                growth_rate = ((last_year_count - prev_year_count) / prev_year_count) * 100
            elif last_year_count > 0:
                # If we went from 0 to N, that is infinite growth, but let's cap/mark it
                growth_rate = 100.0

            trend_entry = ResearchTrend(
                topic=topic,
                category="Research Domain",
                growth_rate=round(growth_rate, 2),
                year=current_year, 
                publication_count=total_pubs,
                citation_count=total_cites,
                trending_score=round(trending_score, 2)
            )
            db.session.add(trend_entry)
            
            # We do NOT add separate "Historical" records into the SAME table if the frontend indiscriminately
            # renders everything in that table as a Card. 
            # Looking at Home.jsx: `trends.map(...)` -> renders all rows.
            # So if we want to show historical graphs, we should either:
            # 1. Filter in frontend (but frontend receives all)
            # 2. Store historical data in a separate table (too big change)
            # 3. Only store the Summary record, and store historical stats in a JSON column? (Schema change needed)
            # 4. Or just DON'T store historical rows in this table for now, since the Graph might not be fully working anyway 
            #    or uses a different endpoint?
            
            # Let's check analytics.py later. For now, strictly fixing the "Duplicate Cards" issue.
            # We will ONLY insert the Summary Record.

        db.session.commit()
    except Exception as e:
        print(f"Error calculating research trends: {e}")
        db.session.rollback()

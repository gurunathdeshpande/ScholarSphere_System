from flask import Blueprint, request, jsonify
from app.services.recommendation import recommender

ai_bp = Blueprint('ai', __name__, url_prefix='/api/ai')

@ai_bp.route('/recommend', methods=['POST'])
def recommend_experts():
    data = request.get_json()
    query = data.get('query')
    
    if not query:
        return jsonify({"msg": "Query is required"}), 400
        
    try:
        # Re-build corpus periodically or on every request? 
        # For this scale, on every request is safe enough, 
        # OR better: build once on startup, but that misses new data. 
        # Let's call build_corpus() if it's cheap (it is for <1000 items).
        recommender.build_corpus() 
        
        results = recommender.recommend(query)
        return jsonify(results), 200
    except Exception as e:
        print(f"AI Error: {e}")
        return jsonify({"error": str(e)}), 500

@ai_bp.route('/summarize', methods=['POST'])
def summarize_text():
    data = request.get_json()
    text = data.get('text')
    
    if not text:
        return jsonify({"msg": "Text is required"}), 400
        
    try:
        from app.services.nlp import nlp_service
        summary = nlp_service.summarize(text)
        return jsonify({"summary": summary}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

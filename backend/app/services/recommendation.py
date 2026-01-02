import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.models.faculty import Faculty
from app.models.publication import Publication
from app.extensions import db

class ExpertiseRecommender:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words='english')
        self.faculty_ids = []
        self.tfidf_matrix = None
        self.is_fitted = False

    def build_corpus(self):
        """
        Builds a text corpus for each faculty member by combining:
        - Research Interests
        - Titles of their publications
        """
        faculty_list = Faculty.query.all()
        corpus = []
        self.faculty_ids = []

        for f in faculty_list:
            # combine research interests
            interests_text = " ".join(f.research_interests) if f.research_interests else ""
            
            # combine publicaton titles (limit to recent 20 for performance if needed, but all is better)
            # We need to join manually or use backref if available
            # Faculty -> FacultyPublication -> Publication
            pubs = f.publications
            pub_titles = " ".join([p.title for p in pubs]) if pubs else ""
            
            # Weighted combo? For now, just concat
            full_text = f"{f.department} {interests_text} {interests_text} {pub_titles}" # interests weighted x2
            
            corpus.append(full_text)
            self.faculty_ids.append(f.id)

        if not corpus:
            return

        self.tfidf_matrix = self.vectorizer.fit_transform(corpus)
        self.is_fitted = True

    def recommend(self, query, top_k=5):
        if not self.is_fitted:
            self.build_corpus()
        
        if not self.is_fitted: # Still not fitted (empty DB)
            return []

        query_vec = self.vectorizer.transform([query])
        
        # Calculate cosine similarity
        similarities = cosine_similarity(query_vec, self.tfidf_matrix).flatten()
        
        # Get top K indices
        top_indices = similarities.argsort()[::-1][:top_k]
        
        results = []
        for idx in top_indices:
            score = similarities[idx]
            if score > 0.05: # Minimum threshold
                faculty_id = self.faculty_ids[idx]
                faculty = Faculty.query.get(faculty_id)
                results.append({
                    "id": faculty.id,
                    "name": faculty.name,
                    "department": faculty.department,
                    "profile_image": faculty.profile_image,
                    "score": round(score * 100, 1),
                    "interests": faculty.research_interests[:3] if faculty.research_interests else []
                })
        
        return results

# Singleton instance
recommender = ExpertiseRecommender()

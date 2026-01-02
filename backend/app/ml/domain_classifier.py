from transformers import pipeline
import numpy as np
from typing import List, Dict
import logging
import asyncio
from functools import lru_cache

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@lru_cache()
def get_classifier():
    """
    Initialize and cache the zero-shot classification pipeline
    """
    return pipeline(
        "zero-shot-classification",
        model="valhalla/distilbart-mnli-12-1",
        device=-1  # CPU
    )

class DomainClassifier:
    def __init__(self):
        """Initialize the domain classifier with pre-defined research domains"""
        self.research_domains = [
            "Computer Science",
            "Artificial Intelligence",
            "Machine Learning",
            "Data Science",
            "Bioinformatics",
            "Natural Language Processing",
            "Computer Vision",
            "Robotics",
            "Physics",
            "Mathematics",
            "Chemistry",
            "Biology",
            "Medicine",
            "Environmental Science",
            "Social Sciences",
            "Economics",
            "Psychology",
            "Engineering",
            "Materials Science",
            "Neuroscience"
        ]

    def classify_text(self, text: str, threshold: float = 0.3) -> List[str]:
        """
        Classify text into research domains using zero-shot classification
        Args:
            text: The text to classify (publication title + abstract)
            threshold: Minimum confidence score to include a domain
        Returns:
            List of predicted research domains
        """
        try:
            classifier = get_classifier()
            result = classifier(
                text,
                candidate_labels=self.research_domains,
                multi_label=True
            )
            
            # Get domains above threshold
            domains = [
                label for label, score in zip(result['labels'], result['scores'])
                if score > threshold
            ]
            
            return domains if domains else ["Other"]
            
        except Exception as e:
            logger.error(f"Error in classify_text: {str(e)}")
            return ["Other"]

    def classify_publication(self, publication: Dict) -> Dict:
        """
        Classify a publication into research domains
        Args:
            publication: Dictionary containing publication details
        Returns:
            Publication dict with added research domains
        """
        try:
            # Combine title and abstract for better classification
            text = f"{publication['title']} {publication.get('abstract', '')}"
            
            # Get domain predictions
            domains = self.classify_text(text)
            
            # Add domains to publication dict
            publication['research_domains'] = domains
            
            return publication
            
        except Exception as e:
            logger.error(f"Error in classify_publication: {str(e)}")
            publication['research_domains'] = ["Other"]
            return publication

    def batch_classify_publications(self, publications: List[Dict]) -> List[Dict]:
        """
        Classify multiple publications
        Args:
            publications: List of publication dictionaries
        Returns:
            List of publications with added research domains
        """
        classified_publications = []
        
        for pub in publications:
            try:
                classified_pub = self.classify_publication(pub)
                classified_publications.append(classified_pub)
            except Exception as e:
                logger.error(f"Error classifying publication: {str(e)}")
                pub['research_domains'] = ["Other"]
                classified_publications.append(pub)
                
        return classified_publications

async def classify_research_domain(texts: List[str]) -> List[dict]:
    """
    Classify research domains for given texts using zero-shot classification
    """
    if not texts:
        return []

    classifier = get_classifier()
    
    # Process in batches to avoid memory issues
    batch_size = 5
    results = []
    
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        batch_results = []
        
        for text in batch:
            if not text.strip():
                batch_results.append({"domains": [], "scores": []})
                continue
                
            # Classify the text against all research domains
            result = classifier(
                text,
                candidate_labels=RESEARCH_DOMAINS,
                multi_label=True
            )
            
            # Filter domains with confidence > 0.3
            confident_domains = [
                {"domain": domain, "confidence": score}
                for domain, score in zip(result["labels"], result["scores"])
                if score > 0.3
            ]
            
            # Sort by confidence
            confident_domains.sort(key=lambda x: x["confidence"], reverse=True)
            
            batch_results.append({
                "domains": [d["domain"] for d in confident_domains[:3]],
                "scores": [d["confidence"] for d in confident_domains[:3]]
            })
            
        results.extend(batch_results)
        
        # Small delay to prevent overloading
        await asyncio.sleep(0.1)
    
    return results 
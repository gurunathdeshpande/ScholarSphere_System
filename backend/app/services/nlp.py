import re
import heapq

class NLProcessor:
    def __init__(self):
        self.stop_words = set(['the', 'and', 'a', 'of', 'to', 'in', 'is', 'that', 'for', 'it', 'with', 'on', 'as', 'are', 'was', 'this', 'by', 'an', 'be', 'or', 'from', 'at'])

    def summarize(self, text, num_sentences=3):
        if not text:
            return ""
        
        # Clean text and split into sentences
        clean_text = re.sub(r'\[[0-9]*\]', ' ', text)
        clean_text = re.sub(r'\s+', ' ', clean_text)
        
        # Simple sentence splitting (can be improved with nltk but regex is fine for now)
        sentences = re.split(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s', clean_text)
        
        if len(sentences) <= num_sentences:
            return text

        # Word frequency
        word_frequencies = {}
        for word in re.findall(r'\w+', clean_text.lower()):
            if word not in self.stop_words:
                if word not in word_frequencies:
                    word_frequencies[word] = 1
                else:
                    word_frequencies[word] += 1

        if not word_frequencies:
            return " ".join(sentences[:num_sentences])

        max_frequency = max(word_frequencies.values())
        for word in word_frequencies.keys():
            word_frequencies[word] = (word_frequencies[word] / max_frequency)

        # Sentence scoring
        sentence_scores = {}
        for sent in sentences:
            for word in re.findall(r'\w+', sent.lower()):
                if word in word_frequencies.keys():
                    if sent not in sentence_scores:
                        sentence_scores[sent] = word_frequencies[word]
                    else:
                        sentence_scores[sent] += word_frequencies[word]

        # Select top sentences
        summary_sentences = heapq.nlargest(num_sentences, sentence_scores, key=sentence_scores.get)
        
        # Sort them matching original order? No, heapq returns list. 
        # Usually checking order in original text is better for coherence.
        # But for extractive summary, just joining them is okay.
        
        return ' '.join(summary_sentences)

nlp_service = NLProcessor()

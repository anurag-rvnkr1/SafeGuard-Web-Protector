from flask import Flask, request, jsonify
from flask_cors import CORS
import re
import pickle
import numpy as np
from urllib.parse import urlparse
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
import requests

app = Flask(__name__)
CORS(app)

class URLMalwareDetector:
    def __init__(self):
        self.model = None
        self.vectorizer = None
        self.load_or_train_model()
    
    def extract_features(self, url):
        """Extract features from URL for ML model"""
        features = {}
        
        # Basic URL features
        features['url_length'] = len(url)
        features['num_dots'] = url.count('.')
        features['num_hyphens'] = url.count('-')
        features['num_underscores'] = url.count('_')
        features['num_slashes'] = url.count('/')
        features['num_questionmarks'] = url.count('?')
        features['num_equals'] = url.count('=')
        features['num_ands'] = url.count('&')
        
        # Domain features
        try:
            parsed = urlparse(url)
            domain = parsed.netloc
            features['domain_length'] = len(domain)
            features['has_ip'] = bool(re.match(r'\d+\.\d+\.\d+\.\d+', domain))
            features['subdomain_count'] = len(domain.split('.')) - 2
        except:
            features['domain_length'] = 0
            features['has_ip'] = False
            features['subdomain_count'] = 0
        
        # Suspicious patterns
        suspicious_keywords = [
            'phishing', 'malware', 'virus', 'hack', 'crack', 'free',
            'download', 'click', 'urgent', 'verify', 'suspend', 'update'
        ]
        
        features['suspicious_keywords'] = sum(1 for keyword in suspicious_keywords if keyword in url.lower())
        
        # URL shorteners
        shorteners = ['bit.ly', 'tinyurl', 't.co', 'goo.gl', 'ow.ly']
        features['is_shortened'] = any(shortener in url for shortener in shorteners)
        
        return list(features.values())
    
    def load_or_train_model(self):
        """Load existing model or train a new one"""
        try:
            # Try to load existing model
            self.model = joblib.load('url_malware_model.pkl')
            self.vectorizer = joblib.load('url_vectorizer.pkl')
            print("Loaded existing model")
        except:
            # Train a new model with sample data
            print("Training new model...")
            self.train_model()
    
    def train_model(self):
        """Train ML model with sample data"""
        # Sample training data (in production, use a large dataset)
        sample_urls = [
            # Malicious URLs (labeled as 1)
            "http://malicious-site.com/phishing",
            "https://192.168.1.1/malware",
            "http://bit.ly/suspicious-link",
            "https://fake-bank-login.com/verify",
            "http://download-virus.exe.com",
            
            # Safe URLs (labeled as 0)
            "https://www.google.com",
            "https://github.com/user/repo",
            "https://stackoverflow.com/questions",
            "https://www.wikipedia.org",
            "https://docs.python.org"
        ]
        
        labels = [1, 1, 1, 1, 1, 0, 0, 0, 0, 0]  # 1 = malicious, 0 = safe
        
        # Extract features
        features = [self.extract_features(url) for url in sample_urls]
        
        # Train model
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.model.fit(features, labels)
        
        # Save model
        joblib.dump(self.model, 'url_malware_model.pkl')
        print("Model trained and saved")
    
    def predict(self, url):
        """Predict if URL is malicious"""
        try:
            features = self.extract_features(url)
            features_array = np.array(features).reshape(1, -1)
            
            # Get prediction probability
            probability = self.model.predict_proba(features_array)[0][1]  # Probability of being malicious
            prediction = probability > 0.5  # Threshold for classification
            
            return {
                'is_malicious': bool(prediction),
                'confidence': float(probability),
                'features_used': len(features)
            }
        except Exception as e:
            print(f"Prediction error: {e}")
            return {
                'is_malicious': False,
                'confidence': 0.0,
                'error': str(e)
            }

# Initialize detector
detector = URLMalwareDetector()

@app.route('/check-url', methods=['POST'])
def check_url():
    try:
        data = request.get_json()
        
        if not data or 'url' not in data:
            return jsonify({'error': 'URL is required'}), 400
        
        url = data['url']
        result = detector.predict(url)
        
        return jsonify({
            'url': url,
            'isMalicious': result['is_malicious'],
            'confidence': result['confidence'],
            'timestamp': request.headers.get('timestamp', ''),
            'model_version': '1.0.0'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'model_loaded': detector.model is not None,
        'version': '1.0.0'
    })

if __name__ == '__main__':
    print("Starting ML API server...")
    print("Endpoints:")
    print("  POST /check-url - Check if URL is malicious")
    print("  GET /health - Health check")
    app.run(host='0.0.0.0', port=5000, debug=True)

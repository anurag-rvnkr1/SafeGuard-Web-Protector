import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib
import re
import urllib.parse
from datetime import datetime
import os

class URLFeatureExtractor:
    """Extract lexical features from URLs"""
    
    @staticmethod
    def extract_features(url):
        """Extract all lexical features from a URL"""
        features = {}
        
        # Basic URL properties
        features['url_length'] = len(url)
        features['domain_length'] = len(urllib.parse.urlparse(url).netloc)
        
        # Count special characters
        features['count_dots'] = url.count('.')
        features['count_hyphens'] = url.count('-')
        features['count_underscores'] = url.count('_')
        features['count_slashes'] = url.count('/')
        features['count_question_marks'] = url.count('?')
        features['count_equal_signs'] = url.count('=')
        features['count_at_signs'] = url.count('@')
        features['count_ampersands'] = url.count('&')
        
        # Count digits and letters
        features['count_digits'] = sum(c.isdigit() for c in url)
        features['count_letters'] = sum(c.isalpha() for c in url)
        features['count_uppercase'] = sum(c.isupper() for c in url)
        
        # URL structure analysis
        parsed_url = urllib.parse.urlparse(url)
        features['has_ip'] = bool(re.match(r'\d+\.\d+\.\d+\.\d+', parsed_url.netloc))
        features['has_port'] = bool(parsed_url.port)
        
        # Subdomain count
        domain_parts = parsed_url.netloc.split('.')
        features['subdomain_count'] = max(0, len(domain_parts) - 2)
        
        # Path analysis
        path = parsed_url.path
        features['path_length'] = len(path)
        features['path_depth'] = path.count('/') - 1 if path.startswith('/') else path.count('/')
        
        # Query parameters
        features['has_query'] = bool(parsed_url.query)
        features['query_length'] = len(parsed_url.query)
        
        # Suspicious patterns
        suspicious_words = ['login', 'verify', 'account', 'update', 'secure', 'bank', 'paypal', 
                          'amazon', 'microsoft', 'apple', 'google', 'facebook', 'download', 
                          'free', 'win', 'prize', 'click', 'here', 'now']
        
        features['suspicious_word_count'] = sum(1 for word in suspicious_words if word in url.lower())
        
        # TLD analysis
        tld = parsed_url.netloc.split('.')[-1] if '.' in parsed_url.netloc else ''
        suspicious_tlds = ['tk', 'ml', 'ga', 'cf', 'gq']
        features['has_suspicious_tld'] = tld.lower() in suspicious_tlds
        
        # Protocol
        features['is_https'] = url.startswith('https://')
        
        # URL shortening services
        shortening_services = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'short.link']
        features['is_shortened'] = any(service in url.lower() for service in shortening_services)
        
        return features

class URLClassifier:
    """Machine Learning model for URL classification"""
    
    def __init__(self):
        self.model = RandomForestClassifier(
            n_estimators=100,
            random_state=42,
            max_depth=10,
            min_samples_split=5
        )
        self.feature_extractor = URLFeatureExtractor()
        self.feature_names = None
        self.model_path = 'models/url_classifier.joblib'
        
    def prepare_data(self, malicious_urls, valid_urls):
        """Prepare training data from URL lists"""
        data = []
        labels = []
        
        # Process malicious URLs
        for url in malicious_urls:
            features = self.feature_extractor.extract_features(url)
            data.append(features)
            labels.append(1)  # 1 for malicious
        
        # Process valid URLs
        for url in valid_urls:
            features = self.feature_extractor.extract_features(url)
            data.append(features)
            labels.append(0)  # 0 for safe
        
        # Convert to DataFrame
        df = pd.DataFrame(data)
        self.feature_names = df.columns.tolist()
        
        return df.values, np.array(labels)
    
    def train(self, malicious_urls, valid_urls):
        """Train the model"""
        print("Preparing training data...")
        X, y = self.prepare_data(malicious_urls, valid_urls)
        
        print(f"Training on {len(X)} samples...")
        print(f"Malicious: {sum(y)}, Safe: {len(y) - sum(y)}")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Train model
        self.model.fit(X_train, y_train)
        
        # Evaluate
        y_pred = self.model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        print(f"Model Accuracy: {accuracy:.4f}")
        print("\nClassification Report:")
        print(classification_report(y_test, y_pred, target_names=['Safe', 'Malicious']))
        
        # Save model
        os.makedirs('models', exist_ok=True)
        joblib.dump({
            'model': self.model,
            'feature_names': self.feature_names,
            'accuracy': accuracy,
            'training_date': datetime.now().isoformat()
        }, self.model_path)
        
        print(f"Model saved to {self.model_path}")
        return accuracy
    
    def load_model(self):
        """Load trained model"""
        if os.path.exists(self.model_path):
            model_data = joblib.load(self.model_path)
            self.model = model_data['model']
            self.feature_names = model_data['feature_names']
            return True
        return False
    
    def predict(self, url):
        """Predict if URL is malicious"""
        if not self.feature_names:
            if not self.load_model():
                return {'prediction': 'unknown', 'confidence': 0.0, 'reason': 'Model not trained'}
        
        # Extract features
        features = self.feature_extractor.extract_features(url)
        
        # Ensure feature order matches training
        feature_vector = []
        for feature_name in self.feature_names:
            feature_vector.append(features.get(feature_name, 0))
        
        # Make prediction
        prediction = self.model.predict([feature_vector])[0]
        confidence = self.model.predict_proba([feature_vector])[0]
        
        # Get feature importance for explanation
        feature_importance = self.model.feature_importances_
        top_features = sorted(
            zip(self.feature_names, feature_vector, feature_importance),
            key=lambda x: x[2],
            reverse=True
        )[:5]
        
        result = {
            'prediction': 'malicious' if prediction == 1 else 'safe',
            'confidence': float(max(confidence)),
            'malicious_probability': float(confidence[1]),
            'safe_probability': float(confidence[0]),
            'top_features': [
                {
                    'feature': feature,
                    'value': value,
                    'importance': importance
                }
                for feature, value, importance in top_features
            ]
        }
        
        # Generate reason
        if prediction == 1:
            reasons = []
            if features.get('has_suspicious_tld', False):
                reasons.append("Suspicious TLD detected")
            if features.get('suspicious_word_count', 0) > 2:
                reasons.append("Multiple suspicious keywords")
            if features.get('url_length', 0) > 100:
                reasons.append("Unusually long URL")
            if features.get('has_ip', False):
                reasons.append("IP address instead of domain")
            
            result['reason'] = '; '.join(reasons) if reasons else "ML model detected malicious patterns"
        else:
            result['reason'] = "URL appears safe based on lexical analysis"
        
        return result

# Global classifier instance
classifier = URLClassifier()

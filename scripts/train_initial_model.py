import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from database import db
from ml_model import classifier

def train_initial_model():
    """Train the initial ML model with sample data"""
    
    print("Loading training data from database...")
    
    # Get training data
    malicious_data = db.get_malicious_urls()
    valid_data = db.get_valid_urls()
    
    if not malicious_data or not valid_data:
        print("No training data found. Please run generate_sample_data.py first.")
        return
    
    malicious_urls = [row['url'] for row in malicious_data]
    valid_urls = [row['url'] for row in valid_data]
    
    print(f"Found {len(malicious_urls)} malicious URLs")
    print(f"Found {len(valid_urls)} valid URLs")
    
    # Train model
    print("Training model...")
    accuracy = classifier.train(malicious_urls, valid_urls)
    
    print(f"Model trained successfully with accuracy: {accuracy:.4f}")
    
    # Test a few predictions
    test_urls = [
        "https://www.google.com",                       # safe
        "http://malware-site.tk/download.exe",          # malicious
        "https://github.com",                           # safe
        "http://phishing-bank.ml/login.php",            # malicious
        "https://www.wikipedia.org",                    # safe
        "http://free-vbucks-generator.biz",             # malicious
        "https://www.amazon.com",                       # safe
        "http://login-verification-security.ru",        # malicious
        "https://www.spotify.com",                      # safe
        "http://paypal-security-alert.cn/login",        # malicious
    ]

    print("\nTesting predictions:")
    for url in test_urls:
        result = classifier.predict(url)
        print(f"URL: {url}")
        print(f"Prediction: {result['prediction']} (confidence: {result['confidence']:.3f})")
        print(f"Reason: {result['reason']}")
        print("-" * 50)

if __name__ == "__main__":
    train_initial_model()

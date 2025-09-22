import schedule
import time
import sys
import os
from datetime import datetime

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from database import db
from ml_model import classifier

def retrain_model():
    """Retrain the model with latest data"""
    
    print(f"[{datetime.now()}] Starting scheduled model retraining...")
    
    try:
        # Get updated training data
        malicious_data = db.get_malicious_urls()
        valid_data = db.get_valid_urls()
        
        malicious_urls = [row['url'] for row in malicious_data]
        valid_urls = [row['url'] for row in valid_data]
        
        if len(malicious_urls) == 0 or len(valid_urls) == 0:
            print("Insufficient training data for retraining")
            return
        
        print(f"Retraining with {len(malicious_urls)} malicious and {len(valid_urls)} valid URLs")
        
        # Retrain model
        accuracy = classifier.train(malicious_urls, valid_urls)
        
        # Log the retraining
        db.log_admin_action(
            "Scheduled model retraining",
            f"New accuracy: {accuracy:.4f}, Dataset size: {len(malicious_urls) + len(valid_urls)}"
        )
        
        print(f"Model retrained successfully with accuracy: {accuracy:.4f}")
        
    except Exception as e:
        print(f"Error during retraining: {e}")
        db.log_admin_action("Retraining failed", str(e))

def run_scheduler():
    """Run the scheduled retraining"""
    
    # Schedule retraining every week on Sunday at 2 AM
    schedule.every().sunday.at("02:00").do(retrain_model)
    
    # For testing, also schedule every hour
    # schedule.every().hour.do(retrain_model)
    
    print("Scheduled retraining service started...")
    print("Model will be retrained every Sunday at 2:00 AM")
    
    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every minute

if __name__ == "__main__":
    run_scheduler()

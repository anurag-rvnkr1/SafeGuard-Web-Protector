import psycopg2
import requests
import random
import string
import pandas as pd
import csv

CSV_FILE_PATH = r"C:\Users\anurag revankar\Desktop\safeguard-url-detection1\models\data\phishing_site_urls.csv"

def read_urls_from_csv():
    """Read URLs from existing CSV file"""
    malicious_urls = []
    valid_urls = []
    
    try:
        with open(CSV_FILE_PATH, newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                url = row.get('url')
                label = row.get('label', '').lower()  # assuming CSV has a 'label' column
                if not url:
                    continue
                if label == 'bad':
                    malicious_urls.append(url)
                elif label == 'good':
                    valid_urls.append(url)
                else:
                    # If label not present, assume all are malicious (optional)
                    malicious_urls.append(url)
    except Exception as e:
        print(f"Error reading CSV: {e}")
    # Generate more malicious URLs with patterns
    for i in range(50):
        # Random suspicious domains
        tlds = ['.tk', '.ml', '.ga', '.cf', '.gq']
        suspicious_words = ['phish', 'scam', 'fake', 'malware', 'virus', 'spam', 'hack']
        brands = ['paypal', 'amazon', 'google', 'microsoft', 'apple', 'facebook']
        
        word = random.choice(suspicious_words)
        brand = random.choice(brands)
        tld = random.choice(tlds)
        
        malicious_urls.append(f"http://{word}-{brand}{tld}/login.php")
        malicious_urls.append(f"https://fake-{brand}{tld}/verify.html")
    
    # Generate more valid URLs
    for i in range(50):
        domains = ['edu', 'gov', 'org', 'com']
        names = ['university', 'college', 'institute', 'foundation', 'center']
        
        name = random.choice(names)
        domain = random.choice(domains)
        
        valid_urls.append(f"https://www.{name}{i}.{domain}")
        valid_urls.append(f"https://{name}-research.{domain}")
    
    return malicious_urls, valid_urls

def insert_sample_data():
    """Insert sample data into database"""
    
    DB_CONFIG = {
        'host': 'localhost',
        'user': 'postgres',
        'password': 'password',
        'database': 'safeguard_db'
    }
    
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Read URLs from CSV instead of generating them
        malicious_urls, valid_urls = read_urls_from_csv()
        
        # Insert malicious URLs
        for url in malicious_urls:
            try:
                cursor.execute(
                    "INSERT INTO malicious_urls (url, source) VALUES (%s, %s)",
                    (url, 'csv_import')
                )
            except psycopg2.IntegrityError:
                conn.rollback()
                continue
            conn.commit()
        
        # Insert valid URLs
        for url in valid_urls:
            try:
                cursor.execute(
                    "INSERT INTO valid_urls (url, source) VALUES (%s, %s)",
                    (url, 'csv_import')
                )
            except psycopg2.IntegrityError:
                conn.rollback()
                continue
            conn.commit()
        
        print(f"Inserted {len(malicious_urls)} malicious URLs")
        print(f"Inserted {len(valid_urls)} valid URLs")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Error inserting sample data: {e}")

if __name__ == "__main__":
    insert_sample_data()

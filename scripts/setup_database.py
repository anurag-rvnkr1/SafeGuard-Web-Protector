import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import os

def create_database():
    """Create the database and tables"""
    
    # Database connection parameters
    DB_CONFIG = {
        'host': 'localhost',
        'user': 'postgres',
        'password': 'password',
        'database': 'postgres'  # Connect to default database first
    }
    
    try:
        # Connect to PostgreSQL server
        conn = psycopg2.connect(**DB_CONFIG)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Create database
        cursor.execute("DROP DATABASE IF EXISTS safeguard_db")
        cursor.execute("CREATE DATABASE safeguard_db")
        print("Database 'safeguard_db' created successfully")
        
        cursor.close()
        conn.close()
        
        # Connect to the new database
        DB_CONFIG['database'] = 'safeguard_db'
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Create tables
        create_tables_sql = """
        -- Malicious URLs table
        CREATE TABLE malicious_urls (
            id SERIAL PRIMARY KEY,
            url TEXT UNIQUE NOT NULL,
            source VARCHAR(50) DEFAULT 'initial',
            date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            verified BOOLEAN DEFAULT FALSE
        );
        
        -- Valid URLs table
        CREATE TABLE valid_urls (
            id SERIAL PRIMARY KEY,
            url TEXT UNIQUE NOT NULL,
            source VARCHAR(50) DEFAULT 'generated',
            date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            verified BOOLEAN DEFAULT TRUE
        );
        
        -- User reports table
        CREATE TABLE user_reports (
            id SERIAL PRIMARY KEY,
            url TEXT NOT NULL,
            report_type VARCHAR(20) NOT NULL, -- 'false_positive' or 'false_negative'
            status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
            date_reported TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            admin_action TIMESTAMP NULL
        );
        
        -- Admin logs table
        CREATE TABLE admin_logs (
            id SERIAL PRIMARY KEY,
            action VARCHAR(100) NOT NULL,
            details TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Model training logs
        CREATE TABLE model_logs (
            id SERIAL PRIMARY KEY,
            version VARCHAR(20) NOT NULL,
            accuracy FLOAT,
            training_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            dataset_size INTEGER,
            model_path TEXT
        );
        
        -- Blocked URLs log (for analytics)
        CREATE TABLE blocked_urls_log (
            id SERIAL PRIMARY KEY,
            url TEXT NOT NULL,
            blocked_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            user_agent TEXT,
            reason VARCHAR(100)
        );
        """
        
        cursor.execute(create_tables_sql)
        conn.commit()
        print("Tables created successfully")
        
        # Insert initial admin user (for demo purposes)
        cursor.execute("""
            CREATE TABLE admin_users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Hash for 'admin123'
        import hashlib
        password_hash = hashlib.sha256('admin123'.encode()).hexdigest()
        cursor.execute(
            "INSERT INTO admin_users (username, password_hash) VALUES (%s, %s)",
            ('admin', password_hash)
        )
        
        conn.commit()
        print("Admin user created (username: admin, password: admin123)")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Error creating database: {e}")

if __name__ == "__main__":
    create_database()

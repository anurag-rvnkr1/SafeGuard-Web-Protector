import psycopg2
from psycopg2.extras import RealDictCursor
import os
from contextlib import contextmanager

class Database:
    def __init__(self):
        self.config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'user': os.getenv('DB_USER', 'postgres'),
            'password': os.getenv('DB_PASSWORD', 'password'),
            'database': os.getenv('DB_NAME', 'safeguard_db'),
            'port': os.getenv('DB_PORT', 5432)
        }
    
    @contextmanager
    def get_connection(self):
        conn = None
        try:
            conn = psycopg2.connect(**self.config)
            yield conn
        except Exception as e:
            if conn:
                conn.rollback()
            raise e
        finally:
            if conn:
                conn.close()
    
    def get_malicious_urls(self):
        """Get all malicious URLs"""
        with self.get_connection() as conn:
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute("SELECT * FROM malicious_urls ORDER BY date_added DESC")
            return cursor.fetchall()
    
    def get_valid_urls(self):
        """Get all valid URLs"""
        with self.get_connection() as conn:
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute("SELECT * FROM valid_urls ORDER BY date_added DESC")
            return cursor.fetchall()
    
    def add_malicious_url(self, url, source='manual'):
        """Add a malicious URL"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO malicious_urls (url, source) VALUES (%s, %s) ON CONFLICT (url) DO NOTHING",
                (url, source)
            )
            conn.commit()
            return cursor.rowcount > 0
    
    def add_valid_url(self, url, source='manual'):
        """Add a valid URL"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO valid_urls (url, source) VALUES (%s, %s) ON CONFLICT (url) DO NOTHING",
                (url, source)
            )
            conn.commit()
            return cursor.rowcount > 0
    
    def remove_url(self, url, table):
        """Remove URL from specified table"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(f"DELETE FROM {table} WHERE url = %s", (url,))
            conn.commit()
            return cursor.rowcount > 0
    
    def add_user_report(self, url, report_type):
        """Add user report"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO user_reports (url, report_type) VALUES (%s, %s)",
                (url, report_type)
            )
            conn.commit()
    
    def get_pending_reports(self):
        """Get pending user reports"""
        with self.get_connection() as conn:
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute(
                "SELECT * FROM user_reports WHERE status = 'pending' ORDER BY date_reported DESC"
            )
            return cursor.fetchall()
    
    def update_report_status(self, report_id, status):
        """Update report status"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE user_reports SET status = %s, admin_action = CURRENT_TIMESTAMP WHERE id = %s",
                (status, report_id)
            )
            conn.commit()
    
    def log_admin_action(self, action, details=None):
        """Log admin action"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO admin_logs (action, details) VALUES (%s, %s)",
                (action, details)
            )
            conn.commit()
    
    def log_blocked_url(self, url, reason, user_agent=None):
        """Log blocked URL for analytics"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO blocked_urls_log (url, reason, user_agent) VALUES (%s, %s, %s)",
                (url, reason, user_agent)
            )
            conn.commit()
    
    def get_admin_user(self, username):
        """Get admin user by username"""
        with self.get_connection() as conn:
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute("SELECT * FROM admin_users WHERE username = %s", (username,))
            return cursor.fetchone()
    
    def get_stats(self):
        """Get system statistics"""
        with self.get_connection() as conn:
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            stats = {}
            
            # Count malicious URLs
            cursor.execute("SELECT COUNT(*) as count FROM malicious_urls")
            stats['malicious_count'] = cursor.fetchone()['count']
            
            # Count valid URLs
            cursor.execute("SELECT COUNT(*) as count FROM valid_urls")
            stats['valid_count'] = cursor.fetchone()['count']
            
            # Count pending reports
            cursor.execute("SELECT COUNT(*) as count FROM user_reports WHERE status = 'pending'")
            stats['pending_reports'] = cursor.fetchone()['count']
            
            # Count blocked URLs today
            cursor.execute("""
                SELECT COUNT(*) as count FROM blocked_urls_log 
                WHERE DATE(blocked_date) = CURRENT_DATE
            """)
            stats['blocked_today'] = cursor.fetchone()['count']
            
            return stats

# Global database instance
db = Database()

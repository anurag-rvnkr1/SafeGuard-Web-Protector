#!/usr/bin/env python3
"""
Startup script for Safeguard URL Detection System
This script helps users get the system running quickly
"""

import subprocess
import sys
import os
import time
import psycopg2
from pathlib import Path

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        print(f"Current version: {sys.version}")
        return False
    print(f"✅ Python version: {sys.version.split()[0]}")
    return True

def check_postgresql():
    """Check if PostgreSQL is running and accessible"""
    try:
        conn = psycopg2.connect(
            host='localhost',
            user='postgres',
            password='password',
            database='postgres',
            connect_timeout=5
        )
        conn.close()
        print("✅ PostgreSQL is running")
        return True
    except Exception as e:
        print("❌ PostgreSQL connection failed")
        print(f"Error: {e}")
        print("\nPlease ensure PostgreSQL is installed and running:")
        print("- Ubuntu/Debian: sudo systemctl start postgresql")
        print("- macOS: brew services start postgresql")
        print("- Windows: Start PostgreSQL service")
        return False

def setup_database():
    """Setup database and initial data"""
    print("\n🔧 Setting up database...")
    
    scripts = [
        "scripts/setup_database.py",
        "scripts/generate_sample_data.py", 
        "scripts/train_initial_model.py"
    ]
    
    for script in scripts:
        if os.path.exists(script):
            print(f"Running {script}...")
            result = subprocess.run([sys.executable, script], capture_output=True, text=True)
            if result.returncode != 0:
                print(f"❌ Error running {script}")
                print(result.stderr)
                return False
            else:
                print(f"✅ {script} completed successfully")
        else:
            print(f"⚠️  {script} not found, skipping...")
    
    return True

def install_requirements():
    """Install Python requirements"""
    print("\n📦 Installing Python requirements...")
    
    if os.path.exists("requirements.txt"):
        result = subprocess.run([
            sys.executable, "-m", "pip", "install", "-r", "requirements.txt"
        ], capture_output=True, text=True)
        
        if result.returncode != 0:
            print("❌ Failed to install requirements")
            print(result.stderr)
            return False
        else:
            print("✅ Requirements installed successfully")
            return True
    else:
        print("⚠️  requirements.txt not found")
        return False

def start_backend():
    """Start the backend server"""
    print("\n🚀 Starting backend server...")
    
    if os.path.exists("backend/main.py"):
        print("Backend server starting at http://localhost:8000")
        print("Press Ctrl+C to stop the server")
        print("-" * 50)
        
        try:
            subprocess.run([sys.executable, "backend/main.py"])
        except KeyboardInterrupt:
            print("\n👋 Backend server stopped")
    else:
        print("❌ backend/main.py not found")
        return False

def main():
    """Main startup function"""
    print("🛡️  Safeguard URL Detection System - Startup Script")
    print("=" * 60)
    
    # Check system requirements
    if not check_python_version():
        return
    
    if not check_postgresql():
        return
    
    # Install requirements
    if not install_requirements():
        return
    
    # Setup database
    if not setup_database():
        return
    
    print("\n✅ System setup completed successfully!")
    print("\nNext steps:")
    print("1. Backend server will start automatically")
    print("2. Open another terminal and run: npm run dev (for frontend)")
    print("3. Install Chrome extension from chrome-extension/ folder")
    print("4. Access admin panel at http://localhost:3000/admin")
    print("   - Username: admin")
    print("   - Password: admin123")
    
    input("\nPress Enter to start the backend server...")
    
    # Start backend
    start_backend()

if __name__ == "__main__":
    main()

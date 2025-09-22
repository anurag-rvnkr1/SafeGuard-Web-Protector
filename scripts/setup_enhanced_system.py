#!/usr/bin/env python3
"""
Enhanced setup script for Safeguard URL Detection System
Includes API key configuration and enhanced features setup
"""

import subprocess
import sys
import os
import time
import psycopg2
from pathlib import Path
import shutil

def print_banner():
    """Print setup banner"""
    print("🛡️" + "="*60)
    print("   SAFEGUARD - Enhanced URL Detection System Setup")
    print("   Real-time Protection | Enhanced Child Mode | Threat Intel")
    print("="*62)

def check_system_requirements():
    """Enhanced system requirements check"""
    print("\n🔍 Checking system requirements...")
    
    requirements = {
        "Python 3.8+": sys.version_info >= (3, 8),
        "PostgreSQL": check_postgresql(),
        "Node.js": check_nodejs(),
        "Chrome/Chromium": check_chrome()
    }
    
    all_good = True
    for req, status in requirements.items():
        status_icon = "✅" if status else "❌"
        print(f"  {status_icon} {req}")
        if not status:
            all_good = False
    
    return all_good

def check_postgresql():
    """Check PostgreSQL availability"""
    try:
        result = subprocess.run(['psql', '--version'], 
                              capture_output=True, text=True, timeout=5)
        return result.returncode == 0
    except:
        return False

def check_nodejs():
    """Check Node.js availability"""
    try:
        result = subprocess.run(['node', '--version'], 
                              capture_output=True, text=True, timeout=5)
        return result.returncode == 0
    except:
        return False

def check_chrome():
    """Check Chrome/Chromium availability"""
    chrome_paths = [
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
    ]
    
    return any(os.path.exists(path) for path in chrome_paths)

def setup_environment():
    """Setup environment variables"""
    print("\n🔧 Setting up environment...")
    
    env_example = Path(".env.example")
    env_file = Path(".env")
    
    if env_example.exists() and not env_file.exists():
        shutil.copy(env_example, env_file)
        print("  ✅ Created .env file from template")
        print("  ⚠️  Please edit .env file to add your API keys")
    elif env_file.exists():
        print("  ✅ .env file already exists")
    else:
        print("  ⚠️  No .env template found")

def install_dependencies():
    """Install all dependencies"""
    print("\n📦 Installing dependencies...")
    
    # Python dependencies
    print("  Installing Python packages...")
    result = subprocess.run([
        sys.executable, "-m", "pip", "install", "-r", "requirements.txt"
    ], capture_output=True, text=True)
    
    if result.returncode != 0:
        print("  ❌ Failed to install Python dependencies")
        print(result.stderr)
        return False
    else:
        print("  ✅ Python dependencies installed")
    """
    # Node.js dependencies
    if os.path.exists("package.json"):
        print("  Installing Node.js packages...")
        result = subprocess.run(["npm", "install"], 
                              capture_output=True, text=True)
        
        if result.returncode != 0:
            print("  ❌ Failed to install Node.js dependencies")
            print(result.stderr)
            return False
        else:
            print("  ✅ Node.js dependencies installed")
    """
    return True

def setup_database():
    """Enhanced database setup"""
    print("\n🗄️ Setting up database...")
    
    scripts = [
        ("Database creation", "scripts/setup_database.py"),
        ("Sample data generation", "scripts/generate_sample_data.py"), 
        ("ML model training", "scripts/train_initial_model.py")
    ]
    
    for description, script in scripts:
        if os.path.exists(script):
            print(f"  Running {description}...")
            result = subprocess.run([sys.executable, script], 
                                  capture_output=True, text=True)
            if result.returncode != 0:
                print(f"  ❌ Failed: {description}")
                print(result.stderr)
                return False
            else:
                print(f"  ✅ {description} completed")
        else:
            print(f"  ⚠️  {script} not found, skipping...")
    
    return True

def setup_chrome_extension():
    """Setup Chrome extension"""
    print("\n🌐 Chrome Extension Setup Instructions:")
    print("  1. Open Chrome and go to chrome://extensions/")
    print("  2. Enable 'Developer mode' (toggle in top right)")
    print("  3. Click 'Load unpacked'")
    print("  4. Select the 'chrome-extension' folder")
    print("  5. The Safeguard extension will appear in your toolbar")
    print("  ✅ Extension ready for installation")

def create_startup_scripts():
    """Create convenient startup scripts"""
    print("\n📝 Creating startup scripts...")
    
    # Backend startup script
    backend_script = """#!/bin/bash
echo "🛡️ Starting Safeguard Backend Server..."
cd "$(dirname "$0")"
python backend/main.py
"""
    
    with open("start_backend.sh", "w") as f:
        f.write(backend_script)
    os.chmod("start_backend.sh", 0o755)
    
    # Frontend startup script  
    frontend_script = """#!/bin/bash
echo "🌐 Starting Safeguard Frontend..."
cd "$(dirname "$0")"
npm run dev
"""
    
    with open("start_frontend.sh", "w") as f:
        f.write(frontend_script)
    os.chmod("start_frontend.sh", 0o755)
    
    print("  ✅ Created start_backend.sh and start_frontend.sh")

def print_completion_message():
    """Print setup completion message"""
    print("\n" + "🎉" + "="*60)
    print("   SETUP COMPLETED SUCCESSFULLY!")
    print("="*62)
    print("\n📋 Next Steps:")
    print("  1. 🔧 Edit .env file to add your API keys (optional)")
    print("  2. 🚀 Start backend: python backend/main.py")
    print("  3. 🌐 Start frontend: npm run dev")
    print("  4. 🔌 Install Chrome extension from chrome-extension/ folder")
    print("  5. 🔐 Access admin panel at http://localhost:3000/admin")
    print("     Username: admin | Password: admin123")
    
    print("\n🔗 URLs:")
    print("  • Frontend: http://localhost:3000")
    print("  • Backend API: http://localhost:8000")
    print("  • API Docs: http://localhost:8000/docs")
    
    print("\n⌨️  Chrome Extension Shortcuts:")
    print("  • Ctrl+Shift+S: Toggle Protection")
    print("  • Ctrl+Shift+C: Toggle Child Mode")
    
    print("\n🛡️ Enhanced Features:")
    print("  ✅ Real-time URL analysis")
    print("  ✅ Google Safe Browsing integration")
    print("  ✅ VirusTotal threat intelligence")
    print("  ✅ Advanced child protection")
    print("  ✅ Machine learning classification")
    print("  ✅ User reporting system")
    
    print("\n" + "="*62)

def main():
    """Main setup function"""
    print_banner()
    
    # Check requirements
    if not check_system_requirements():
        print("\n❌ System requirements not met. Please install missing components.")
        return False
    
    # Setup environment
    setup_environment()
    
    # Install dependencies
    if not install_dependencies():
        return False
    
    # Setup database
    if not setup_database():
        return False
    
    # Chrome extension instructions
    setup_chrome_extension()
    
    # Create startup scripts
    create_startup_scripts()
    
    # Success message
    print_completion_message()
    
    return True

if __name__ == "__main__":
    try:
        success = main()
        if success:
            print("\n🎯 Ready for your final year project demonstration!")
        else:
            print("\n❌ Setup failed. Please check the errors above.")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Setup interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)

# 🚀 Safeguard Setup Guide

This guide will help you get the Safeguard URL Detection System running quickly.

## 📋 Prerequisites

### Required Software
- **Python 3.8+** - [Download Python](https://python.org/downloads/)
- **Node.js 16+** - [Download Node.js](https://nodejs.org/)
- **PostgreSQL 12+** - [Download PostgreSQL](https://postgresql.org/download/)
- **Chrome Browser** - For the extension

### System Requirements
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space
- **OS**: Windows 10+, macOS 10.15+, or Linux

## 🔧 Quick Setup (Recommended)

### Option 1: Automated Setup Script

1. **Clone the repository**
   \`\`\`bash
   git clone  https://github.com/anurag-rvnkr1/SafeGuard-Web-Protector.git
   cd SafeGuard-Web-Protector
   \`\`\`

2. **Run the setup script**
   \`\`\`bash
   python scripts/start_system.py
   \`\`\`

   This script will:
   - Check system requirements
   - Install Python dependencies
   - Setup PostgreSQL database
   - Generate sample data
   - Train the ML model
   - Start the backend server

3. **Start the frontend** (in a new terminal)
   \`\`\`bash
   npm install
   npm run dev
   \`\`\`

4. **Install Chrome Extension**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `extension` folder

### Option 2: Docker Setup (Alternative)

\`\`\`bash
# Clone repository
git clone https://github.com/anurag-rvnkr1/SafeGuard-Web-Protector.git
cd SafeGuard-Web-Protector

# Start all services
docker-compose up -d

# Initialize database
docker-compose exec backend python scripts/setup_database.py
docker-compose exec backend python scripts/generate_sample_data.py
docker-compose exec backend python scripts/train_initial_model.py
\`\`\`

## 🛠️ Manual Setup

If the automated script doesn't work, follow these manual steps:

### 1. Database Setup

\`\`\`bash
# Start PostgreSQL service
# Ubuntu/Debian:
sudo systemctl start postgresql

# macOS:
brew services start postgresql

# Windows: Start PostgreSQL service from Services panel
\`\`\`

\`\`\`bash
# Setup database
python scripts/setup_database.py
python scripts/generate_sample_data.py
python scripts/train_initial_model.py
\`\`\`

### 2. Backend Setup

\`\`\`bash
# Install Python dependencies
pip install -r requirements.txt

# Start backend server
python backend/main.py
\`\`\`

The backend will be available at `http://localhost:8000`

### 3. Frontend Setup

\`\`\`bash
# Install Node.js dependencies
npm install

# Start development server
npm run dev
\`\`\`

The frontend will be available at `http://localhost:3000`

### 4. Chrome Extension Setup

1. Open Chrome browser
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `chrome-extension` folder from the project
6. The Safeguard extension should now appear in your toolbar

## 🔍 Verification

### Test the System

1. **Backend API Test**
   \`\`\`bash
   curl http://localhost:8000/
   \`\`\`
   Should return: `{"message": "Safeguard URL Detection API", "version": "1.0.0"}`

2. **Frontend Test**
   - Open `http://localhost:3000`
   - Try checking a URL like `https://google.com`

3. **Admin Panel Test**
   - Go to `http://localhost:3000/admin`
   - Login with: `admin` / `admin123`

4. **Chrome Extension Test**
   - Click the Safeguard icon in Chrome toolbar
   - Should show current page status

## 🚨 Troubleshooting

### Common Issues

#### "Failed to fetch" Error
- **Cause**: Backend server not running
- **Solution**: Start backend with `python backend/main.py`

#### Database Connection Error
- **Cause**: PostgreSQL not running or wrong credentials
- **Solution**: 
  \`\`\`bash
  # Check PostgreSQL status
  sudo systemctl status postgresql
  
  # Start if not running
  sudo systemctl start postgresql
  \`\`\`

#### Port Already in Use
- **Backend (8000)**: Change port in `backend/main.py`
- **Frontend (3000)**: Use `npm run dev -- -p 3001`

#### Chrome Extension Not Loading
- **Solution**: 
  1. Check Developer mode is enabled
  2. Reload the extension
  3. Check browser console for errors

#### ML Model Training Fails
- **Cause**: Insufficient training data
- **Solution**: Run `python scripts/generate_sample_data.py` first

### Getting Help

If you encounter issues:

1. **Check the logs** - Look for error messages in terminal
2. **Verify prerequisites** - Ensure all required software is installed
3. **Check ports** - Make sure ports 3000, 8000, and 5432 are available
4. **Database connection** - Verify PostgreSQL is running and accessible

### Environment Variables

Create a `.env` file if needed:

\`\`\`env
# Database
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=safeguard_db
DB_PORT=5432

# Security
SECRET_KEY=your-secret-key-here

# Optional: Google Safe Browsing API
GOOGLE_SAFE_BROWSING_API_KEY=your-api-key

# VirusTotal API (Optional)
VIRUSTOTAL_API_KEY= your-api-key

# Development Settings
DEBUG=true
LOG_LEVEL=INFO

# CORS Settings
CORS_ORIGINS=http://localhost:3000,chrome-extension://*
CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_HEADERS=Content-Type,Authorization

# API Configuration
API_BASE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000

\`\`\`

## 🎯 Next Steps

Once everything is running:

1. **Test URL Detection** - Try various URLs in the web interface
2. **Explore Admin Panel** - Manage datasets and view statistics
3. **Configure Extension** - Enable child mode and test blocking
4. **Add Custom URLs** - Use admin panel to add your own malicious/safe URLs
5. **Monitor Performance** - Check model accuracy and system stats

## 📚 Additional Resources

- **API Documentation**: `http://localhost:8000/docs` (when backend is running)
- **Project Structure**: See `README.md` for detailed architecture
- **Chrome Extension Guide**: See `chrome-extension/README.md`

---

**🎓 Perfect for Final Year Projects!**

This system demonstrates:
- Machine Learning implementation
- Full-stack web development
- Browser extension development
- Database design and management
- Security and authentication
- Real-time data processing

# Safeguard - Malicious URL Detection System

A comprehensive malicious URL detection system powered by machine learning, featuring a Chrome extension, web dashboard, and real-time threat intelligence.

## 🚀 Features

- **Machine Learning Detection**: Advanced URL classification using lexical features
- **Real-time Threat Intelligence**: Integration with Google Safe Browsing API
- **Chrome Extension**: Real-time URL monitoring and blocking
- **Child Protection Mode**: Advanced content filtering for inappropriate material
- **Admin Dashboard**: Comprehensive management interface
- **Automated Retraining**: Weekly model updates with new data
- **User Reporting**: Community-driven false positive/negative reporting

## 🏗️ Architecture

### Backend (FastAPI)
- RESTful API for URL prediction and management
- PostgreSQL database for persistent storage
- Machine learning pipeline with scikit-learn
- JWT-based admin authentication
- Real-time threat feed integration

### Frontend (Next.js)
- Modern React-based web interface
- Admin dashboard for dataset management
- Real-time statistics and analytics
- Responsive design with Tailwind CSS

### Chrome Extension (Manifest V3)
- Real-time URL monitoring
- Automatic malicious URL blocking
- Child mode content filtering
- User reporting functionality
- Popup interface for settings

### Machine Learning
- Random Forest classifier
- Lexical feature extraction
- High accuracy (95%+ target)
- Interpretable predictions
- Automated retraining pipeline

## 📦 Installation

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL 15+
- Chrome browser (for extension)

### Backend Setup

1. **Clone the repository**
\`\`\`bash
git clone https://github.com/anurag-rvnkr1/SafeGuard-Web-Protector.git
cd SafeGuard-Web-Protector-Main
\`\`\`

2. **Install Python dependencies**
\`\`\`bash
pip install -r requirements.txt
\`\`\`

3. **Setup PostgreSQL database**
\`\`\`bash
# Start PostgreSQL service
sudo systemctl start postgresql

# Create database and tables
python scripts/setup_database.py
\`\`\`

4. **Generate sample data**
\`\`\`bash
python scripts/generate_sample_data.py
\`\`\`

5. **Train initial model**
\`\`\`bash
python scripts/train_initial_model.py
\`\`\`

6. **Start the backend server**
\`\`\`bash
python backend/main.py
\`\`\`

The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Install Node.js dependencies**
\`\`\`bash
npm install
\`\`\`

2. **Start the development server**
\`\`\`bash
npm run dev
\`\`\`

The frontend will be available at `http://localhost:3000`

### Chrome Extension Setup

1. **Open Chrome and navigate to Extensions**
   - Go to `chrome://extensions/`
   - Enable "Developer mode"

2. **Load the extension**
   - Click "Load unpacked"
   - Select the `extension` folder

3. **Configure the extension**
   - Click on the Safeguard icon in the toolbar
   - Enable protection and configure child mode as needed


### Admin Credentials

Default admin credentials:
- Username: `admin`
- Password: `admin123`

**⚠️ Change these credentials in production!**

## 🚀 Docker Deployment

For production deployment using Docker:

\`\`\`bash
# Build and start all services
docker-compose up -d

# Initialize database
docker-compose exec backend python scripts/setup_database.py
docker-compose exec backend python scripts/generate_sample_data.py
docker-compose exec backend python scripts/train_initial_model.py
\`\`\`

## 📊 API Endpoints

### Public Endpoints
- `POST /predict-url` - Check if URL is malicious
- `POST /report-malicious` - Report false negative
- `POST /report-valid` - Report false positive

### Admin Endpoints (Requires Authentication)
- `POST /admin-login` - Admin authentication
- `GET /admin/stats` - System statistics
- `GET /admin/datasets` - View URL datasets
- `GET /admin/reports` - View user reports
- `POST /admin/manage-url` - Add/remove URLs
- `POST /admin/handle-report/{id}` - Approve/reject reports
- `POST /admin/retrain-model` - Trigger model retraining

## 🧠 Machine Learning Features

The system extracts the following lexical features from URLs:

- **Basic Properties**: URL length, domain length
- **Character Counts**: Dots, hyphens, slashes, digits, letters
- **Structure Analysis**: Subdomain count, path depth, query parameters
- **Suspicious Patterns**: Suspicious keywords, TLD analysis
- **Security Indicators**: HTTPS usage, IP addresses, URL shorteners

## 🛡️ Security Features

### URL Classification
- Machine learning-based detection
- Real-time threat intelligence
- High accuracy with low false positives

### Child Protection
- Keyword-based filtering
- Category-based blocking (adult, gambling, violence)
- Customizable content policies

### Admin Security
- JWT-based authentication
- Secure password hashing
- Action logging and audit trails

## 📈 Monitoring & Analytics

The admin dashboard provides:
- Real-time blocking statistics
- Dataset growth metrics
- Model performance tracking
- User report management
- System health monitoring

## 🔄 Automated Retraining

The system includes automated model retraining:
- Weekly scheduled retraining
- Incorporates user feedback
- Performance monitoring
- Rollback capabilities

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation
- Open an issue on GitHub
- Contact the development team

## 🎯 Future Enhancements

- Integration with additional threat feeds
- Advanced NLP-based content analysis
- Mobile app development
- Enterprise features and scaling
- Advanced analytics and reporting

---

**⚠️ Disclaimer**: This system is designed for educational and research purposes. While it aims for high accuracy, no security system is 100% foolproof. Always exercise caution when browsing the internet.

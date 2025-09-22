from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List
import hashlib
import jwt
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from database import db
from ml_model import classifier
from enhanced_threat_feed import enhanced_safe_browsing, virustotal_api, enhanced_child_filter

app = FastAPI(
    title="Safeguard URL Detection API", 
    version="1.0.0",
    description="Advanced malicious URL detection with ML and threat intelligence"
)

# Enhanced CORS middleware for Chrome extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "chrome-extension://*",
        "moz-extension://*",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()
SECRET_KEY = os.getenv("SECRET_KEY", "safeguard-secret-key-2024")

# Enhanced Pydantic models
class URLRequest(BaseModel):
    url: str
    child_mode: Optional[bool] = False
    strict_mode: Optional[bool] = False
    real_time: Optional[bool] = False
    immediate_scan: Optional[bool] = False

class URLResponse(BaseModel):
    url: str
    prediction: str
    confidence: float
    reason: str
    threat_feed_result: Optional[dict] = None
    child_mode_result: Optional[dict] = None

class ReportRequest(BaseModel):
    url: str
    report_type: str  # 'false_positive' or 'false_negative'
    source: Optional[str] = "web"
    timestamp: Optional[str] = None
    block_reason: Optional[str] = None
    block_category: Optional[str] = None
    block_confidence: Optional[str] = None
    report_source: Optional[str] = "web"

class AdminLogin(BaseModel):
    username: str
    password: str

class URLManagement(BaseModel):
    url: str
    action: str  # 'add' or 'remove'
    table: str   # 'malicious_urls' or 'valid_urls'

class AutoAddRequest(BaseModel):
    url: str
    reason: Optional[str] = None
    category: Optional[str] = None
    confidence: Optional[float] = None
    source: Optional[str] = "auto"
    ml_prediction: Optional[str] = None
    threat_feeds: Optional[dict] = None

class MoveURLRequest(BaseModel):
    url: str
    report_type: str
    source: Optional[str] = "user_report"
    action: Optional[str] = "move_immediately"

# Helper functions
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=["HS256"])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return username
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Initialize ML model
@app.on_event("startup")
async def startup_event():
    """Initialize the ML model and database on startup"""
    try:
        logger.info("🛡️ Starting Safeguard URL Detection API...")
        
        # Test database connection
        try:
            stats = db.get_stats()
            logger.info(f"✅ Database connected - {stats['malicious_count']} malicious, {stats['valid_count']} valid URLs")
        except Exception as e:
            logger.error(f"❌ Database connection failed: {e}")
            logger.info("⚠️ Some features may not work without database")
        
        # Initialize ML model
        if not classifier.load_model():
            logger.info("📚 Training new ML model...")
            try:
                # Get training data from database
                malicious_data = db.get_malicious_urls()
                valid_data = db.get_valid_urls()
                
                malicious_urls = [row['url'] for row in malicious_data]
                valid_urls = [row['url'] for row in valid_data]
                
                if len(malicious_urls) > 0 and len(valid_urls) > 0:
                    accuracy = classifier.train(malicious_urls, valid_urls)
                    logger.info(f"✅ ML Model trained with accuracy: {accuracy:.4f}")
                else:
                    logger.warning("⚠️ No training data available - using fallback detection")
            except Exception as e:
                logger.error(f"❌ Model training failed: {e}")
                logger.info("⚠️ Using fallback detection methods")
        else:
            logger.info("✅ ML Model loaded successfully")
            
        logger.info("🚀 API server ready at http://localhost:8000")
        logger.info("📖 API documentation at http://localhost:8000/docs")
        logger.info("🔍 Health check at http://localhost:8000/health")
        
    except Exception as e:
        logger.error(f"❌ Startup error: {e}")

# API Endpoints

@app.get("/")
async def root():
    return {
        "message": "Safeguard URL Detection API", 
        "version": "1.0.0",
        "status": "online",
        "timestamp": datetime.utcnow().isoformat(),
        "features": [
            "ML-based URL classification",
            "Google Safe Browsing integration", 
            "VirusTotal threat intelligence",
            "Enhanced child protection",
            "Real-time analysis",
            "Chrome extension support",
            "Immediate blocking",
            "Auto database updates"
        ]
    }

@app.get("/health")
async def health_check():
    """Enhanced health check endpoint for Chrome extension"""
    try:
        health_status = {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "version": "1.0.0"
        }
        
        # Test database connection
        try:
            stats = db.get_stats()
            health_status["database"] = {
                "status": "connected",
                "malicious_urls": stats['malicious_count'],
                "valid_urls": stats['valid_count'],
                "pending_reports": stats['pending_reports']
            }
        except Exception as e:
            health_status["database"] = {
                "status": "error",
                "error": str(e)
            }
        
        # Test ML model
        try:
            test_result = classifier.predict("https://example.com")
            health_status["ml_model"] = {
                "status": "loaded",
                "test_prediction": test_result['prediction']
            }
        except Exception as e:
            health_status["ml_model"] = {
                "status": "error", 
                "error": str(e)
            }
        
        # Test threat feeds
        health_status["threat_feeds"] = {
            "google_safe_browsing": "simulated" if enhanced_safe_browsing.api_key == 'demo_key' else "active",
            "virustotal": "simulated" if virustotal_api.api_key == 'demo_key' else "active"
        }
        
        return health_status
        
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")

@app.post("/predict-url", response_model=URLResponse)
async def predict_url(request: URLRequest):
    """Enhanced URL prediction with immediate scanning and strict mode support"""
    try:
        logger.info(f"🔍 {'IMMEDIATE ' if request.immediate_scan else ''}Analyzing URL: {request.url}")
        
        # Initialize results
        ml_result = {"prediction": "unknown", "confidence": 0.5, "reason": "Analysis unavailable"}
        gsb_result = {"is_threat": False, "source": "Google Safe Browsing"}
        vt_result = {"is_threat": False, "source": "VirusTotal"}
        child_result = None
        
        # Get ML prediction
        try:
            ml_result = classifier.predict(request.url)
            logger.info(f"🤖 ML Prediction: {ml_result['prediction']} ({ml_result['confidence']:.3f})")
        except Exception as e:
            logger.error(f"❌ ML prediction failed: {e}")
            # Fallback to basic pattern matching
            ml_result = basic_url_analysis(request.url)
        
        # Check Google Safe Browsing
        try:
            gsb_result = enhanced_safe_browsing.check_url(request.url)
            if gsb_result['is_threat']:
                logger.info(f"⚠️ Google Safe Browsing: {gsb_result['threat_type']}")
        except Exception as e:
            logger.error(f"❌ Google Safe Browsing check failed: {e}")
        
        # Check VirusTotal
        try:
            vt_result = virustotal_api.check_url(request.url)
            if vt_result['is_threat']:
                logger.info(f"⚠️ VirusTotal: {vt_result.get('positives', 0)} detections")
        except Exception as e:
            logger.error(f"❌ VirusTotal check failed: {e}")
        
        # Check child mode if enabled
        if request.child_mode:
            try:
                child_result = enhanced_child_filter.check_url(request.url, strict_mode=request.strict_mode)
                if child_result['should_block']:
                    logger.info(f"👶 Child Mode: {child_result['category']}")
            except Exception as e:
                logger.error(f"❌ Child mode check failed: {e}")
        
        # ENHANCED PREDICTION LOGIC with strict mode
        final_prediction = ml_result['prediction']
        final_reason = ml_result['reason']
        final_confidence = ml_result['confidence']
        
        # Enhanced threat feed override logic
        threat_sources = []
        
        # Google Safe Browsing override
        if gsb_result['is_threat']:
            final_prediction = 'malicious'
            final_reason = f"Google Safe Browsing: {gsb_result.get('threat_type', 'Threat detected')}"
            final_confidence = max(final_confidence, gsb_result.get('confidence', 0.95))
            threat_sources.append('Google Safe Browsing')
        
        # VirusTotal override (lowered threshold for better protection)
        if vt_result['is_threat']:
            positives = vt_result.get('positives', 0)
            total = vt_result.get('total', 0)
            if positives > 2:  # Lower threshold for immediate blocking
                final_prediction = 'malicious'
                final_reason = f"VirusTotal: {positives}/{total} engines detected threat"
                final_confidence = max(final_confidence, vt_result.get('confidence', 0.9))
                threat_sources.append('VirusTotal')
        
        # STRICT MODE ENHANCED LOGIC
        if request.strict_mode:
            # Lower confidence threshold for blocking in strict mode
            if ml_result['confidence'] > 0.6 and ml_result['prediction'] != 'safe':
                final_prediction = 'malicious'
                final_reason = f"Strict Mode: {ml_result['reason']} (lowered threshold)"
                final_confidence = max(final_confidence, 0.8)
            
            # Additional strict mode patterns
            strict_patterns = ['download', 'free', 'click-here', 'winner', 'prize', 'urgent']
            url_lower = request.url.lower()
            for pattern in strict_patterns:
                if pattern in url_lower:
                    final_prediction = 'malicious'
                    final_reason = f"Strict Mode: Suspicious pattern detected ({pattern})"
                    final_confidence = max(final_confidence, 0.75)
                    break
        
        # Child mode override
        if request.child_mode and child_result and child_result['should_block']:
            final_prediction = 'blocked'
            final_reason = f"Child Mode: {child_result['reason']}"
            final_confidence = child_result.get('confidence', 0.95)
        
        # Combine threat sources
        if threat_sources:
            final_reason += f" (Sources: {', '.join(threat_sources)})"
        
        # Log result and handle database updates
        if final_prediction in ['malicious', 'blocked']:
            try:
                db.log_blocked_url(request.url, final_reason)
            except Exception as e:
                logger.error(f"❌ Failed to log blocked URL: {e}")
            logger.info(f"🚫 BLOCKED: {request.url} - {final_reason}")
        else:
            logger.info(f"✅ SAFE: {request.url}")
        
        return URLResponse(
            url=request.url,
            prediction=final_prediction,
            confidence=final_confidence,
            reason=final_reason,
            threat_feed_result={
                'google_safe_browsing': gsb_result,
                'virustotal': vt_result
            },
            child_mode_result=child_result
        )
        
    except Exception as e:
        logger.error(f"❌ Error analyzing URL {request.url}: {e}")
        # Return safe prediction on error to avoid blocking legitimate sites
        return URLResponse(
            url=request.url,
            prediction="safe",
            confidence=0.5,
            reason=f"Analysis error: {str(e)}",
            threat_feed_result=None,
            child_mode_result=None
        )

def basic_url_analysis(url: str) -> dict:
    """Basic fallback URL analysis when ML model fails"""
    url_lower = url.lower()
    
    # High-risk patterns
    high_risk_patterns = [
        'malware', 'virus', 'trojan', 'phishing', 'scam', 'fake-',
        'hack', 'crack', 'exploit', 'spam', 'fraud', 'suspicious'
    ]
    
    for pattern in high_risk_patterns:
        if pattern in url_lower:
            return {
                "prediction": "malicious",
                "confidence": 0.8,
                "reason": f"Basic analysis: Suspicious pattern detected ({pattern})"
            }
    
    return {
        "prediction": "safe",
        "confidence": 0.7,
        "reason": "Basic analysis: No obvious threats detected"
    }

@app.post("/report-malicious")
async def report_malicious(request: ReportRequest):
    """Enhanced report malicious with immediate database integration"""
    try:
        # Add to user reports
        db.add_user_report(request.url, 'false_negative')
        
        # IMMEDIATE DATABASE UPDATE: Move to malicious database
        success = db.add_malicious_url(request.url, 'user_report_immediate')
        
        if success:
            logger.info(f"📝 IMMEDIATE: {request.url} added to malicious database from user report")
        
        # Log the action
        db.log_admin_action(
            "User report - malicious (immediate)",
            f"URL: {request.url}, Source: {request.source}, Reason: {request.block_reason}"
        )
        
        logger.info(f"📝 Report received: {request.url} as malicious from {request.source}")
        return {
            "message": "Report submitted and URL added to malicious database immediately",
            "url": request.url,
            "action": "moved_to_malicious_db"
        }
    except Exception as e:
        logger.error(f"❌ Error reporting malicious URL: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/report-valid")
async def report_valid(request: ReportRequest):
    """Enhanced report valid with immediate database integration"""
    try:
        # Add to user reports
        db.add_user_report(request.url, 'false_positive')
        
        # IMMEDIATE DATABASE UPDATE: Move to valid database and remove from malicious
        db.remove_url(request.url, 'malicious_urls')
        success = db.add_valid_url(request.url, 'user_report_immediate')
        
        if success:
            logger.info(f"📝 IMMEDIATE: {request.url} moved to valid database from user report")
        
        # Log the action
        db.log_admin_action(
            "User report - valid (immediate)",
            f"URL: {request.url}, Source: {request.source}, Reason: {request.block_reason}"
        )
        
        logger.info(f"📝 Report received: {request.url} as safe from {request.source}")
        return {
            "message": "Report submitted and URL moved to valid database immediately",
            "url": request.url,
            "action": "moved_to_valid_db"
        }
    except Exception as e:
        logger.error(f"❌ Error reporting valid URL: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# NEW ENDPOINTS FOR AUTO DATABASE UPDATES

@app.post("/admin/auto-add-malicious")
async def auto_add_malicious(request: AutoAddRequest):
    """Auto-add malicious URLs detected by ML model"""
    try:
        success = db.add_malicious_url(request.url, request.source)
        
        if success:
            # Log detailed information
            db.log_admin_action(
                "Auto-added malicious URL",
                f"URL: {request.url}, Reason: {request.reason}, Confidence: {request.confidence}, ML: {request.ml_prediction}"
            )
            
            logger.info(f"🤖 AUTO-ADDED MALICIOUS: {request.url} (confidence: {request.confidence})")
            
            return {
                "message": "URL automatically added to malicious database",
                "url": request.url,
                "success": True
            }
        else:
            return {
                "message": "URL already exists in database",
                "url": request.url,
                "success": False
            }
            
    except Exception as e:
        logger.error(f"❌ Error auto-adding malicious URL: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/admin/auto-add-valid")
async def auto_add_valid(request: AutoAddRequest):
    """Auto-add valid URLs with high confidence"""
    try:
        success = db.add_valid_url(request.url, request.source)
        
        if success:
            # Log detailed information
            db.log_admin_action(
                "Auto-added valid URL",
                f"URL: {request.url}, Confidence: {request.confidence}, ML: {request.ml_prediction}"
            )
            
            logger.info(f"🤖 AUTO-ADDED VALID: {request.url} (confidence: {request.confidence})")
            
            return {
                "message": "URL automatically added to valid database",
                "url": request.url,
                "success": True
            }
        else:
            return {
                "message": "URL already exists in database",
                "url": request.url,
                "success": False
            }
            
    except Exception as e:
        logger.error(f"❌ Error auto-adding valid URL: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/admin/move-reported-url")
async def move_reported_url(request: MoveURLRequest):
    """Move reported URLs to appropriate database immediately"""
    try:
        if request.report_type == 'false_positive':
            # URL was incorrectly flagged as malicious, move to valid
            db.remove_url(request.url, 'malicious_urls')
            success = db.add_valid_url(request.url, request.source)
            action = "moved_to_valid"
        elif request.report_type == 'false_negative':
            # URL was incorrectly flagged as safe, move to malicious
            db.remove_url(request.url, 'valid_urls')
            success = db.add_malicious_url(request.url, request.source)
            action = "moved_to_malicious"
        else:
            raise HTTPException(status_code=400, detail="Invalid report type")
        
        if success:
            db.log_admin_action(
                f"Moved reported URL ({action})",
                f"URL: {request.url}, Report type: {request.report_type}"
            )
            
            logger.info(f"🔄 MOVED REPORTED URL: {request.url} ({action})")
            
            return {
                "message": f"URL {action.replace('_', ' ')} successfully",
                "url": request.url,
                "action": action,
                "success": True
            }
        else:
            return {
                "message": "No changes made (URL may already exist)",
                "url": request.url,
                "success": False
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error moving reported URL: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/admin-login")
async def admin_login(login_data: AdminLogin):
    """Admin login endpoint"""
    try:
        # Get admin user from database
        admin_user = db.get_admin_user(login_data.username)
        
        if not admin_user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Verify password
        password_hash = hashlib.sha256(login_data.password.encode()).hexdigest()
        
        if admin_user['password_hash'] != password_hash:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Create access token
        access_token = create_access_token(data={"sub": login_data.username})
        
        db.log_admin_action("Admin login", f"User: {login_data.username}")
        logger.info(f"🔐 Admin login: {login_data.username}")
        
        return {"access_token": access_token, "token_type": "bearer"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Admin login error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/stats")
async def get_admin_stats(current_user: str = Depends(verify_token)):
    """Get system statistics"""
    try:
        stats = db.get_stats()
        return stats
    except Exception as e:
        logger.error(f"❌ Error getting stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/datasets")
async def get_datasets(current_user: str = Depends(verify_token)):
    """Get all datasets"""
    try:
        malicious_urls = db.get_malicious_urls()
        valid_urls = db.get_valid_urls()
        
        return {
            "malicious_urls": malicious_urls,
            "valid_urls": valid_urls
        }
    except Exception as e:
        logger.error(f"❌ Error getting datasets: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/admin/reports")
async def get_reports(current_user: str = Depends(verify_token)):
    """Get pending user reports"""
    try:
        reports = db.get_pending_reports()
        return {"reports": reports}
    except Exception as e:
        logger.error(f"❌ Error getting reports: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/admin/manage-url")
async def manage_url(request: URLManagement, current_user: str = Depends(verify_token)):
    """Add or remove URLs from datasets"""
    try:
        if request.action == 'add':
            if request.table == 'malicious_urls':
                success = db.add_malicious_url(request.url, 'admin')
            elif request.table == 'valid_urls':
                success = db.add_valid_url(request.url, 'admin')
            else:
                raise HTTPException(status_code=400, detail="Invalid table")
            
            action_desc = f"Added URL to {request.table}: {request.url}"
            
        elif request.action == 'remove':
            success = db.remove_url(request.url, request.table)
            action_desc = f"Removed URL from {request.table}: {request.url}"
            
        else:
            raise HTTPException(status_code=400, detail="Invalid action")
        
        if success:
            db.log_admin_action(action_desc)
            logger.info(f"🔧 Admin action: {action_desc}")
            return {"message": f"URL {request.action}ed successfully"}
        else:
            return {"message": "No changes made (URL may already exist or not found)"}
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error managing URL: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/admin/handle-report/{report_id}")
async def handle_report(report_id: int, action: str, current_user: str = Depends(verify_token)):
    """Approve or reject user report"""
    try:
        if action not in ['approve', 'reject']:
            raise HTTPException(status_code=400, detail="Invalid action")
        
        # Get the report first
        reports = db.get_pending_reports()
        report = next((r for r in reports if r['id'] == report_id), None)
        
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        if action == 'approve':
            # Move URL to appropriate dataset
            if report['report_type'] == 'false_positive':
                # URL was incorrectly flagged as malicious, move to valid
                db.remove_url(report['url'], 'malicious_urls')
                db.add_valid_url(report['url'], 'user_report')
            elif report['report_type'] == 'false_negative':
                # URL was incorrectly flagged as safe, move to malicious
                db.remove_url(report['url'], 'valid_urls')
                db.add_malicious_url(report['url'], 'user_report')
        
        # Update report status
        db.update_report_status(report_id, 'approved' if action == 'approve' else 'rejected')
        
        db.log_admin_action(
            f"Report {action}ed",
            f"Report ID: {report_id}, URL: {report['url']}, Type: {report['report_type']}"
        )
        
        logger.info(f"📋 Report {action}ed: {report['url']}")
        return {"message": f"Report {action}ed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error handling report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/admin/retrain-model")
async def retrain_model(current_user: str = Depends(verify_token)):
    """Retrain the ML model"""
    try:
        # Get updated training data
        malicious_data = db.get_malicious_urls()
        valid_data = db.get_valid_urls()
        
        malicious_urls = [row['url'] for row in malicious_data]
        valid_urls = [row['url'] for row in valid_data]
        
        if len(malicious_urls) == 0 or len(valid_urls) == 0:
            raise HTTPException(status_code=400, detail="Insufficient training data")
        
        # Retrain model
        accuracy = classifier.train(malicious_urls, valid_urls)
        
        db.log_admin_action(
            "Model retrained",
            f"New accuracy: {accuracy:.4f}, Dataset size: {len(malicious_urls) + len(valid_urls)}"
        )
        
        logger.info(f"🤖 Model retrained - Accuracy: {accuracy:.4f}")
        
        return {
            "message": "Model retrained successfully",
            "accuracy": accuracy,
            "dataset_size": len(malicious_urls) + len(valid_urls)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error retraining model: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    print("🛡️ Starting Safeguard Backend Server with Enhanced Features...")
    print("✨ Features: Immediate Blocking | Auto Database Updates | Active Reporting")
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000, 
        log_level="info",
        access_log=True
    )

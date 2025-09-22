#!/usr/bin/env python3
"""
Complete Extension Testing Script
Tests all features including immediate blocking and reporting
"""

import subprocess
import sys
import os
import time
import requests
from pathlib import Path

def print_banner():
    print("🧪" + "="*60)
    print("   COMPLETE EXTENSION TESTING")
    print("   Immediate Blocking | Reporting | Database Integration")
    print("="*62)

def test_backend_connection():
    """Test backend server connectivity"""
    print("\n🔍 Testing backend connection...")
    
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("  ✅ Backend is healthy")
            print(f"    Status: {data.get('status')}")
            print(f"    Database: {data.get('database', {}).get('status')}")
            print(f"    ML Model: {data.get('ml_model', {}).get('status')}")
            return True
        else:
            print(f"  ❌ Backend responded with status: {response.status_code}")
            return False
    except Exception as e:
        print(f"  ❌ Backend connection failed: {e}")
        return False

def test_ml_prediction():
    """Test ML model predictions"""
    print("\n🤖 Testing ML model predictions...")
    
    test_urls = [
        ("https://google.com", "safe"),
        ("http://malware-site.tk/download.exe", "malicious"),
        ("https://github.com", "safe"),
        ("http://phishing-bank.ml/login.php", "malicious"),
        ("http://virus-download.cf/trojan.zip", "malicious"),
    ]
    
    for url, expected in test_urls:
        try:
            response = requests.post("http://localhost:8000/predict-url", 
                json={
                    "url": url,
                    "child_mode": False,
                    "strict_mode": False,
                    "immediate_scan": True
                },
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                prediction = data['prediction']
                confidence = data['confidence']
                
                status = "✅" if prediction == expected else "⚠️"
                print(f"  {status} {url}")
                print(f"    Prediction: {prediction} (expected: {expected})")
                print(f"    Confidence: {confidence:.3f}")
                print(f"    Reason: {data['reason']}")
            else:
                print(f"  ❌ {url} - API Error: {response.status_code}")
                
        except Exception as e:
            print(f"  ❌ {url} - Error: {e}")

def test_child_mode():
    """Test child mode filtering"""
    print("\n👶 Testing child mode filtering...")
    
    child_test_urls = [
        ("https://google.com", False),
        ("http://adult-content.com/porn", True),
        ("http://casino-gambling.com/bet", True),
        ("http://violence-game.com/weapon", True),
    ]
    
    for url, should_block in child_test_urls:
        try:
            response = requests.post("http://localhost:8000/predict-url", 
                json={
                    "url": url,
                    "child_mode": True,
                    "strict_mode": False,
                    "immediate_scan": True
                },
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                prediction = data['prediction']
                blocked = prediction in ['blocked', 'malicious']
                
                status = "✅" if blocked == should_block else "⚠️"
                print(f"  {status} {url}")
                print(f"    Blocked: {blocked} (expected: {should_block})")
                if data.get('child_mode_result'):
                    print(f"    Child Mode: {data['child_mode_result']['reason']}")
            else:
                print(f"  ❌ {url} - API Error: {response.status_code}")
                
        except Exception as e:
            print(f"  ❌ {url} - Error: {e}")

def test_strict_mode():
    """Test strict mode filtering"""
    print("\n🔒 Testing strict mode filtering...")
    
    strict_test_urls = [
        ("https://google.com", False),
        ("http://suspicious-site.tk/download", True),
        ("http://free-download.ml/click-here", True),
        ("http://winner-prize.ga/urgent", True),
    ]
    
    for url, should_block in strict_test_urls:
        try:
            response = requests.post("http://localhost:8000/predict-url", 
                json={
                    "url": url,
                    "child_mode": False,
                    "strict_mode": True,
                    "immediate_scan": True
                },
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                prediction = data['prediction']
                blocked = prediction in ['blocked', 'malicious']
                
                status = "✅" if blocked == should_block else "⚠️"
                print(f"  {status} {url}")
                print(f"    Blocked: {blocked} (expected: {should_block})")
                print(f"    Reason: {data['reason']}")
            else:
                print(f"  ❌ {url} - API Error: {response.status_code}")
                
        except Exception as e:
            print(f"  ❌ {url} - Error: {e}")

def test_reporting_system():
    """Test reporting system"""
    print("\n📝 Testing reporting system...")
    
    test_reports = [
        ("http://false-positive.com", "false_positive"),
        ("http://false-negative.com", "false_negative"),
    ]
    
    for url, report_type in test_reports:
        try:
            endpoint = "report-valid" if report_type == "false_positive" else "report-malicious"
            response = requests.post(f"http://localhost:8000/{endpoint}", 
                json={
                    "url": url,
                    "report_type": report_type,
                    "source": "test_script",
                    "timestamp": "2024-01-01T00:00:00Z"
                },
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"  ✅ {url} reported as {report_type}")
                print(f"    Message: {data['message']}")
                print(f"    Action: {data.get('action', 'N/A')}")
            else:
                print(f"  ❌ {url} - Report Error: {response.status_code}")
                
        except Exception as e:
            print(f"  ❌ {url} - Error: {e}")

def test_auto_database_updates():
    """Test automatic database updates"""
    print("\n🗄️ Testing automatic database updates...")
    
    try:
        # Test auto-add malicious
        response = requests.post("http://localhost:8000/admin/auto-add-malicious", 
            json={
                "url": "http://test-malicious-auto.com",
                "reason": "Test auto-add malicious",
                "category": "malicious",
                "confidence": 0.95,
                "source": "test_script",
                "ml_prediction": "malicious"
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"  ✅ Auto-add malicious: {data['message']}")
        else:
            print(f"  ❌ Auto-add malicious failed: {response.status_code}")
        
        # Test auto-add valid
        response = requests.post("http://localhost:8000/admin/auto-add-valid", 
            json={
                "url": "http://test-valid-auto.com",
                "confidence": 0.98,
                "source": "test_script",
                "ml_prediction": "safe"
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"  ✅ Auto-add valid: {data['message']}")
        else:
            print(f"  ❌ Auto-add valid failed: {response.status_code}")
            
    except Exception as e:
        print(f"  ❌ Auto database update error: {e}")

def print_extension_instructions():
    """Print extension testing instructions"""
    print("\n" + "🎯" + "="*60)
    print("   CHROME EXTENSION TESTING INSTRUCTIONS")
    print("="*62)
    
    print("\n📋 MANUAL TESTING STEPS:")
    print("  1. Install Chrome Extension:")
    print("     • Open chrome://extensions/")
    print("     • Enable 'Developer mode'")
    print("     • Click 'Load unpacked'")
    print("     • Select 'chrome-extension' folder")
    
    print("\n  2. Test Immediate Blocking:")
    print("     • Visit: http://malware-test.tk/virus")
    print("     • Should block immediately with error page")
    print("     • Check error page shows ML model detection")
    
    print("\n  3. Test Child Mode:")
    print("     • Enable Child Mode in extension popup")
    print("     • Visit: http://adult-content.com/porn")
    print("     • Should block with child protection message")
    
    print("\n  4. Test Strict Mode:")
    print("     • Enable Strict Mode in extension popup")
    print("     • Visit: http://suspicious-site.tk/download")
    print("     • Should block with strict mode message")
    
    print("\n  5. Test Active Reporting:")
    print("     • Get blocked on any site")
    print("     • Click 'Report as Safe' button")
    print("     • Should show success message")
    print("     • URL should be moved to valid database")
    
    print("\n  6. Test Toggle Buttons:")
    print("     • All toggles should work and persist")
    print("     • Protection should enable/disable correctly")
    print("     • Real-time analysis should update")
    
    print("\n⌨️ KEYBOARD SHORTCUTS:")
    print("  • Ctrl+Shift+S: Toggle Protection")
    print("  • Ctrl+Shift+C: Toggle Child Mode")
    print("  • R: Report as Safe (on blocked page)")
    print("  • M: Confirm Malicious (on blocked page)")
    
    print("\n🔍 VERIFICATION:")
    print("  • Check browser console for extension logs")
    print("  • Verify backend receives requests")
    print("  • Check database updates in admin panel")
    print("  • Test all toggle combinations")
    
    print("\n" + "="*62)

def main():
    """Main testing function"""
    print_banner()
    
    # Test backend connection
    if not test_backend_connection():
        print("\n❌ Backend not available. Please start: python backend/main.py")
        return False
    
    # Test ML predictions
    test_ml_prediction()
    
    # Test child mode
    test_child_mode()
    
    # Test strict mode
    test_strict_mode()
    
    # Test reporting system
    test_reporting_system()
    
    # Test auto database updates
    test_auto_database_updates()
    
    # Print extension instructions
    print_extension_instructions()
    
    print("\n🎉 BACKEND TESTING COMPLETED!")
    print("🚀 Now test the Chrome extension manually using the instructions above.")
    
    return True

if __name__ == "__main__":
    try:
        success = main()
        if success:
            print("\n✅ All backend tests completed successfully!")
        else:
            print("\n❌ Some tests failed. Check the output above.")
    except KeyboardInterrupt:
        print("\n\n⚠️ Testing interrupted by user")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")

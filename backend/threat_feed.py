import requests
import hashlib
import urllib.parse
from typing import Dict, List
import os

class GoogleSafeBrowsingAPI:
    """Integration with Google Safe Browsing API"""
    
    def __init__(self):
        self.api_key = os.getenv('GOOGLE_SAFE_BROWSING_API_KEY', 'demo_key')
        self.base_url = "https://safebrowsing.googleapis.com/v4/threatMatches:find"
        
    def check_url(self, url: str) -> Dict:
        """Check URL against Google Safe Browsing database"""
        
        # For demo purposes, simulate API response
        # In production, you would make actual API calls
        if self.api_key == 'demo_key':
            return self._simulate_safe_browsing_check(url)
        
        try:
            payload = {
                "client": {
                    "clientId": "safeguard-extension",
                    "clientVersion": "1.0.0"
                },
                "threatInfo": {
                    "threatTypes": [
                        "MALWARE",
                        "SOCIAL_ENGINEERING",
                        "UNWANTED_SOFTWARE",
                        "POTENTIALLY_HARMFUL_APPLICATION"
                    ],
                    "platformTypes": ["ANY_PLATFORM"],
                    "threatEntryTypes": ["URL"],
                    "threatEntries": [{"url": url}]
                }
            }
            
            response = requests.post(
                f"{self.base_url}?key={self.api_key}",
                json=payload,
                timeout=5
            )
            
            if response.status_code == 200:
                result = response.json()
                if 'matches' in result and result['matches']:
                    threat_type = result['matches'][0]['threatType']
                    return {
                        'is_threat': True,
                        'threat_type': threat_type,
                        'source': 'Google Safe Browsing'
                    }
                else:
                    return {
                        'is_threat': False,
                        'threat_type': None,
                        'source': 'Google Safe Browsing'
                    }
            else:
                return {
                    'is_threat': False,
                    'threat_type': None,
                    'source': 'Google Safe Browsing',
                    'error': f"API Error: {response.status_code}"
                }
                
        except Exception as e:
            return {
                'is_threat': False,
                'threat_type': None,
                'source': 'Google Safe Browsing',
                'error': str(e)
            }
    
    def _simulate_safe_browsing_check(self, url: str) -> Dict:
        """Simulate Safe Browsing API for demo purposes"""
        
        # Known malicious patterns for demo
        malicious_patterns = [
            'malware', 'phishing', 'scam', 'virus', 'trojan',
            'fake-', 'phish-', 'spam-', 'hack', 'exploit'
        ]
        
        url_lower = url.lower()
        
        for pattern in malicious_patterns:
            if pattern in url_lower:
                return {
                    'is_threat': True,
                    'threat_type': 'MALWARE' if 'malware' in pattern or 'virus' in pattern else 'SOCIAL_ENGINEERING',
                    'source': 'Google Safe Browsing (Simulated)'
                }
        
        # Check for suspicious TLDs
        suspicious_tlds = ['.tk', '.ml', '.ga', '.cf', '.gq']
        parsed_url = urllib.parse.urlparse(url)
        domain = parsed_url.netloc.lower()
        
        for tld in suspicious_tlds:
            if domain.endswith(tld):
                return {
                    'is_threat': True,
                    'threat_type': 'SOCIAL_ENGINEERING',
                    'source': 'Google Safe Browsing (Simulated)'
                }
        
        return {
            'is_threat': False,
            'threat_type': None,
            'source': 'Google Safe Browsing (Simulated)'
        }

class ChildModeFilter:
    """Content filtering for child mode"""
    
    def __init__(self):
        self.adult_keywords = [
            'porn', 'sex', 'adult', 'xxx', 'nude', 'naked', 'erotic',
            'casino', 'gambling', 'bet', 'poker', 'slots',
            'violence', 'weapon', 'gun', 'knife', 'blood',
            'drug', 'cocaine', 'marijuana', 'alcohol', 'beer', 'wine'
        ]
        
        self.adult_domains = [
            'pornhub.com', 'xvideos.com', 'xhamster.com',
            'bet365.com', 'pokerstars.com', 'casino.com'
        ]
    
    def check_url(self, url: str) -> Dict:
        """Check if URL should be blocked in child mode"""
        
        url_lower = url.lower()
        parsed_url = urllib.parse.urlparse(url_lower)
        domain = parsed_url.netloc
        
        # Check domain blacklist
        for blocked_domain in self.adult_domains:
            if blocked_domain in domain:
                return {
                    'should_block': True,
                    'category': 'adult_content',
                    'reason': f'Blocked domain: {blocked_domain}'
                }
        
        # Check keywords in URL
        for keyword in self.adult_keywords:
            if keyword in url_lower:
                category = self._categorize_keyword(keyword)
                return {
                    'should_block': True,
                    'category': category,
                    'reason': f'Inappropriate keyword detected: {keyword}'
                }
        
        return {
            'should_block': False,
            'category': None,
            'reason': 'URL appears appropriate for children'
        }
    
    def _categorize_keyword(self, keyword: str) -> str:
        """Categorize blocked keyword"""
        if keyword in ['porn', 'sex', 'adult', 'xxx', 'nude', 'naked', 'erotic']:
            return 'adult_content'
        elif keyword in ['casino', 'gambling', 'bet', 'poker', 'slots']:
            return 'gambling'
        elif keyword in ['violence', 'weapon', 'gun', 'knife', 'blood']:
            return 'violence'
        elif keyword in ['drug', 'cocaine', 'marijuana', 'alcohol', 'beer', 'wine']:
            return 'substance_abuse'
        else:
            return 'inappropriate_content'

# Global instances
safe_browsing = GoogleSafeBrowsingAPI()
child_filter = ChildModeFilter()

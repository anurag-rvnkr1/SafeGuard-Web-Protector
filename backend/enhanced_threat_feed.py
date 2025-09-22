import requests
import hashlib
import urllib.parse
from typing import Dict, List
import os
import time
import json
from datetime import datetime, timedelta

class GoogleSafeBrowsingAPI:
    """Enhanced Google Safe Browsing API integration"""
    
    def __init__(self):
        self.api_key = os.getenv('GOOGLE_SAFE_BROWSING_API_KEY', 'demo_key')
        self.base_url = "https://safebrowsing.googleapis.com/v4/threatMatches:find"
        self.cache = {}  # Simple cache for API responses
        self.cache_duration = 300  # 5 minutes cache
        
    def check_url(self, url: str) -> Dict:
        """Check URL against Google Safe Browsing database with caching"""
        
        # Check cache first
        cache_key = hashlib.md5(url.encode()).hexdigest()
        if cache_key in self.cache:
            cached_result, timestamp = self.cache[cache_key]
            if time.time() - timestamp < self.cache_duration:
                return cached_result
        
        # For demo purposes with real API structure
        if self.api_key == 'demo_key':
            result = self._simulate_safe_browsing_check(url)
        else:
            result = self._real_api_check(url)
        
        # Cache the result
        self.cache[cache_key] = (result, time.time())
        return result
    
    def _real_api_check(self, url: str) -> Dict:
        """Make actual API call to Google Safe Browsing"""
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
                        "POTENTIALLY_HARMFUL_APPLICATION",
                        "THREAT_TYPE_UNSPECIFIED"
                    ],
                    "platformTypes": ["ANY_PLATFORM", "WINDOWS", "LINUX", "OSX"],
                    "threatEntryTypes": ["URL"],
                    "threatEntries": [{"url": url}]
                }
            }
            
            response = requests.post(
                f"{self.base_url}?key={self.api_key}",
                json=payload,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                if 'matches' in result and result['matches']:
                    threat_type = result['matches'][0]['threatType']
                    platform_type = result['matches'][0].get('platformType', 'ANY_PLATFORM')
                    return {
                        'is_threat': True,
                        'threat_type': threat_type,
                        'platform_type': platform_type,
                        'source': 'Google Safe Browsing',
                        'confidence': 0.95
                    }
                else:
                    return {
                        'is_threat': False,
                        'threat_type': None,
                        'source': 'Google Safe Browsing',
                        'confidence': 0.9
                    }
            else:
                return {
                    'is_threat': False,
                    'threat_type': None,
                    'source': 'Google Safe Browsing',
                    'error': f"API Error: {response.status_code}",
                    'confidence': 0.0
                }
                
        except Exception as e:
            return {
                'is_threat': False,
                'threat_type': None,
                'source': 'Google Safe Browsing',
                'error': str(e),
                'confidence': 0.0
            }
    
    def _simulate_safe_browsing_check(self, url: str) -> Dict:
        """Enhanced simulation with more realistic patterns"""
        
        url_lower = url.lower()
        
        # High-risk patterns
        high_risk_patterns = [
            'malware', 'virus', 'trojan', 'ransomware', 'spyware',
            'phishing', 'phish-', 'fake-', 'scam', 'fraud',
            'exploit', 'hack', 'crack', 'keygen', 'warez'
        ]
        
        # Medium-risk patterns
        medium_risk_patterns = [
            'download-now', 'free-download', 'click-here',
            'winner', 'congratulations', 'prize', 'lottery'
        ]
        
        # Check for high-risk patterns
        for pattern in high_risk_patterns:
            if pattern in url_lower:
                return {
                    'is_threat': True,
                    'threat_type': 'MALWARE' if pattern in ['malware', 'virus', 'trojan'] else 'SOCIAL_ENGINEERING',
                    'source': 'Google Safe Browsing (Enhanced Simulation)',
                    'confidence': 0.95,
                    'pattern_matched': pattern
                }
        
        # Check for medium-risk patterns
        for pattern in medium_risk_patterns:
            if pattern in url_lower:
                return {
                    'is_threat': True,
                    'threat_type': 'SOCIAL_ENGINEERING',
                    'source': 'Google Safe Browsing (Enhanced Simulation)',
                    'confidence': 0.8,
                    'pattern_matched': pattern
                }
        
        # Check for suspicious TLDs
        suspicious_tlds = ['.tk', '.ml', '.ga', '.cf', '.gq', '.pw', '.top']
        parsed_url = urllib.parse.urlparse(url)
        domain = parsed_url.netloc.lower()
        
        for tld in suspicious_tlds:
            if domain.endswith(tld):
                return {
                    'is_threat': True,
                    'threat_type': 'SOCIAL_ENGINEERING',
                    'source': 'Google Safe Browsing (Enhanced Simulation)',
                    'confidence': 0.75,
                    'reason': f'Suspicious TLD: {tld}'
                }
        
        # Check for IP addresses instead of domains
        import re
        if re.match(r'\d+\.\d+\.\d+\.\d+', domain):
            return {
                'is_threat': True,
                'threat_type': 'SOCIAL_ENGINEERING',
                'source': 'Google Safe Browsing (Enhanced Simulation)',
                'confidence': 0.7,
                'reason': 'IP address instead of domain name'
            }
        
        return {
            'is_threat': False,
            'threat_type': None,
            'source': 'Google Safe Browsing (Enhanced Simulation)',
            'confidence': 0.9
        }

class VirusTotalAPI:
    """VirusTotal API integration for enhanced threat detection"""
    
    def __init__(self):
        self.api_key = os.getenv('VIRUSTOTAL_API_KEY', 'demo_key')
        self.base_url = "https://www.virustotal.com/vtapi/v2/url"
        self.cache = {}
        self.cache_duration = 600  # 10 minutes cache
        
    def check_url(self, url: str) -> Dict:
        """Check URL against VirusTotal database"""
        
        # Check cache first
        cache_key = hashlib.md5(url.encode()).hexdigest()
        if cache_key in self.cache:
            cached_result, timestamp = self.cache[cache_key]
            if time.time() - timestamp < self.cache_duration:
                return cached_result
        
        if self.api_key == 'demo_key':
            result = self._simulate_virustotal_check(url)
        else:
            result = self._real_api_check(url)
        
        # Cache the result
        self.cache[cache_key] = (result, time.time())
        return result
    
    def _real_api_check(self, url: str) -> Dict:
        """Make actual API call to VirusTotal"""
        try:
            # First, submit URL for scanning
            scan_params = {
                'apikey': self.api_key,
                'url': url
            }
            
            scan_response = requests.post(
                f"{self.base_url}/scan",
                data=scan_params,
                timeout=10
            )
            
            if scan_response.status_code != 200:
                return {
                    'is_threat': False,
                    'source': 'VirusTotal',
                    'error': f"Scan API Error: {scan_response.status_code}",
                    'confidence': 0.0
                }
            
            # Wait a moment for scan to process
            time.sleep(2)
            
            # Get scan report
            report_params = {
                'apikey': self.api_key,
                'resource': url
            }
            
            report_response = requests.get(
                f"{self.base_url}/report",
                params=report_params,
                timeout=10
            )
            
            if report_response.status_code == 200:
                result = report_response.json()
                
                if result.get('response_code') == 1:  # URL found in database
                    positives = result.get('positives', 0)
                    total = result.get('total', 0)
                    
                    if positives > 0:
                        threat_ratio = positives / total if total > 0 else 0
                        return {
                            'is_threat': True,
                            'positives': positives,
                            'total': total,
                            'threat_ratio': threat_ratio,
                            'scan_date': result.get('scan_date'),
                            'source': 'VirusTotal',
                            'confidence': min(0.95, 0.5 + (threat_ratio * 0.5))
                        }
                    else:
                        return {
                            'is_threat': False,
                            'positives': 0,
                            'total': total,
                            'source': 'VirusTotal',
                            'confidence': 0.85
                        }
                else:
                    return {
                        'is_threat': False,
                        'source': 'VirusTotal',
                        'message': 'URL not found in database',
                        'confidence': 0.5
                    }
            else:
                return {
                    'is_threat': False,
                    'source': 'VirusTotal',
                    'error': f"Report API Error: {report_response.status_code}",
                    'confidence': 0.0
                }
                
        except Exception as e:
            return {
                'is_threat': False,
                'source': 'VirusTotal',
                'error': str(e),
                'confidence': 0.0
            }
    
    def _simulate_virustotal_check(self, url: str) -> Dict:
        """Simulate VirusTotal API for demo purposes"""
        
        url_lower = url.lower()
        
        # Simulate different threat levels
        high_threat_patterns = ['malware', 'virus', 'trojan', 'ransomware']
        medium_threat_patterns = ['phishing', 'scam', 'fake-', 'suspicious']
        low_threat_patterns = ['ads', 'popup', 'redirect']
        
        # High threat simulation
        for pattern in high_threat_patterns:
            if pattern in url_lower:
                return {
                    'is_threat': True,
                    'positives': 45,  # High detection rate
                    'total': 70,
                    'threat_ratio': 0.64,
                    'source': 'VirusTotal (Simulation)',
                    'confidence': 0.95,
                    'detected_engines': ['Kaspersky', 'Symantec', 'McAfee', 'Avast']
                }
        
        # Medium threat simulation
        for pattern in medium_threat_patterns:
            if pattern in url_lower:
                return {
                    'is_threat': True,
                    'positives': 15,  # Medium detection rate
                    'total': 70,
                    'threat_ratio': 0.21,
                    'source': 'VirusTotal (Simulation)',
                    'confidence': 0.75,
                    'detected_engines': ['Kaspersky', 'Symantec']
                }
        
        # Low threat simulation
        for pattern in low_threat_patterns:
            if pattern in url_lower:
                return {
                    'is_threat': True,
                    'positives': 3,  # Low detection rate
                    'total': 70,
                    'threat_ratio': 0.04,
                    'source': 'VirusTotal (Simulation)',
                    'confidence': 0.6,
                    'detected_engines': ['Generic']
                }
        
        return {
            'is_threat': False,
            'positives': 0,
            'total': 70,
            'source': 'VirusTotal (Simulation)',
            'confidence': 0.85
        }

class EnhancedChildModeFilter:
    """Enhanced content filtering for child mode with multiple detection methods"""
    
    def __init__(self):
        # Expanded keyword categories
        self.adult_keywords = [
            'porn', 'sex', 'adult', 'xxx', 'nude', 'naked', 'erotic', 'nsfw',
            'escort', 'webcam', 'cam', 'strip', 'fetish', 'bdsm', 'milf'
        ]
        
        self.gambling_keywords = [
            'casino', 'gambling', 'bet', 'poker', 'slots', 'jackpot',
            'lottery', 'roulette', 'blackjack', 'bingo', 'sportsbook'
        ]
        
        self.violence_keywords = [
            'violence', 'weapon', 'gun', 'knife', 'blood', 'murder',
            'kill', 'death', 'torture', 'war', 'fight', 'assault'
        ]
        
        self.substance_keywords = [
            'drug', 'cocaine', 'marijuana', 'weed', 'alcohol', 'beer', 'wine',
            'vodka', 'whiskey', 'cigarette', 'tobacco', 'vape', 'smoking'
        ]
        
        self.hate_keywords = [
            'hate', 'racist', 'nazi', 'terrorism', 'extremist', 'radical'
        ]
        
        # Domain blacklists by category
        self.adult_domains = [
            'pornhub.com', 'xvideos.com', 'xhamster.com', 'redtube.com',
            'youporn.com', 'tube8.com', 'spankbang.com', 'xnxx.com'
        ]
        
        self.gambling_domains = [
            'bet365.com', 'pokerstars.com', 'casino.com', 'williamhill.com',
            'betfair.com', '888casino.com', 'partypoker.com'
        ]
        
        self.social_media_restricted = [
            'tiktok.com', 'snapchat.com', 'instagram.com', 'twitter.com'
        ]
    
    def check_url(self, url: str, strict_mode: bool = False) -> Dict:
        """Enhanced URL checking with multiple filters"""
        
        url_lower = url.lower()
        parsed_url = urllib.parse.urlparse(url_lower)
        domain = parsed_url.netloc
        path = parsed_url.path
        query = parsed_url.query
        
        # Check domain blacklists
        domain_result = self._check_domain_blacklist(domain)
        if domain_result['should_block']:
            return domain_result
        
        # Check keywords in URL
        keyword_result = self._check_keywords(url_lower)
        if keyword_result['should_block']:
            return keyword_result
        
        # Check path and query parameters
        path_result = self._check_path_and_query(path, query)
        if path_result['should_block']:
            return path_result
        
        # Strict mode additional checks
        if strict_mode:
            strict_result = self._strict_mode_check(url_lower, domain)
            if strict_result['should_block']:
                return strict_result
        
        return {
            'should_block': False,
            'category': None,
            'reason': 'Content appears appropriate for children',
            'confidence': 0.9
        }
    
    def _check_domain_blacklist(self, domain: str) -> Dict:
        """Check domain against blacklists"""
        
        # Adult content domains
        for blocked_domain in self.adult_domains:
            if blocked_domain in domain or domain.endswith(blocked_domain):
                return {
                    'should_block': True,
                    'category': 'adult_content',
                    'reason': f'Adult content domain detected: {blocked_domain}',
                    'confidence': 0.95,
                    'severity': 'high'
                }
        
        # Gambling domains
        for blocked_domain in self.gambling_domains:
            if blocked_domain in domain or domain.endswith(blocked_domain):
                return {
                    'should_block': True,
                    'category': 'gambling',
                    'reason': f'Gambling domain detected: {blocked_domain}',
                    'confidence': 0.95,
                    'severity': 'high'
                }
        
        return {'should_block': False}
    
    def _check_keywords(self, url: str) -> Dict:
        """Check for inappropriate keywords"""
        
        # Adult content keywords
        for keyword in self.adult_keywords:
            if keyword in url:
                return {
                    'should_block': True,
                    'category': 'adult_content',
                    'reason': f'Adult content keyword detected: {keyword}',
                    'confidence': 0.9,
                    'severity': 'high'
                }
        
        # Gambling keywords
        for keyword in self.gambling_keywords:
            if keyword in url:
                return {
                    'should_block': True,
                    'category': 'gambling',
                    'reason': f'Gambling keyword detected: {keyword}',
                    'confidence': 0.85,
                    'severity': 'medium'
                }
        
        # Violence keywords
        for keyword in self.violence_keywords:
            if keyword in url:
                return {
                    'should_block': True,
                    'category': 'violence',
                    'reason': f'Violent content keyword detected: {keyword}',
                    'confidence': 0.8,
                    'severity': 'medium'
                }
        
        # Substance abuse keywords
        for keyword in self.substance_keywords:
            if keyword in url:
                return {
                    'should_block': True,
                    'category': 'substance_abuse',
                    'reason': f'Substance abuse keyword detected: {keyword}',
                    'confidence': 0.75,
                    'severity': 'medium'
                }
        
        # Hate speech keywords
        for keyword in self.hate_keywords:
            if keyword in url:
                return {
                    'should_block': True,
                    'category': 'hate_speech',
                    'reason': f'Hate speech keyword detected: {keyword}',
                    'confidence': 0.9,
                    'severity': 'high'
                }
        
        return {'should_block': False}
    
    def _check_path_and_query(self, path: str, query: str) -> Dict:
        """Check URL path and query parameters"""
        
        combined = f"{path} {query}".lower()
        
        # Look for suspicious patterns in path/query
        suspicious_patterns = [
            'download', 'crack', 'keygen', 'torrent', 'pirate',
            'hack', 'cheat', 'exploit', 'bypass'
        ]
        
        for pattern in suspicious_patterns:
            if pattern in combined:
                return {
                    'should_block': True,
                    'category': 'suspicious_content',
                    'reason': f'Suspicious pattern in URL: {pattern}',
                    'confidence': 0.7,
                    'severity': 'medium'
                }
        
        return {'should_block': False}
    
    def _strict_mode_check(self, url: str, domain: str) -> Dict:
        """Additional checks for strict child mode"""
        
        # Block social media in strict mode
        for social_domain in self.social_media_restricted:
            if social_domain in domain:
                return {
                    'should_block': True,
                    'category': 'social_media',
                    'reason': f'Social media blocked in strict mode: {social_domain}',
                    'confidence': 0.8,
                    'severity': 'low'
                }
        
        # Block file sharing sites
        file_sharing_patterns = ['mediafire', 'rapidshare', 'megaupload', '4shared']
        for pattern in file_sharing_patterns:
            if pattern in domain:
                return {
                    'should_block': True,
                    'category': 'file_sharing',
                    'reason': f'File sharing site blocked in strict mode: {pattern}',
                    'confidence': 0.75,
                    'severity': 'medium'
                }
        
        return {'should_block': False}

# Global enhanced instances
enhanced_safe_browsing = GoogleSafeBrowsingAPI()
virustotal_api = VirusTotalAPI()
enhanced_child_filter = EnhancedChildModeFilter()

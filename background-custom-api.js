// Updated background.js with custom ML API
class SafeGuardService {
  constructor() {
    // Your custom ML API endpoint
    this.apiEndpoint = "http://localhost:5000/check-url" // Local development
    // this.apiEndpoint = "https://your-ml-api.herokuapp.com/check-url" // Production

    this.childModeKeywords = [
      "adult",
      "porn",
      "xxx",
      "gambling",
      "casino",
      "violence",
      "drugs",
      "alcohol",
      "tobacco",
      "dating",
      "explicit",
    ]
    this.init()
  }

  async checkMaliciousURL(url) {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "SafeGuard-Extension/1.0.0",
        },
        body: JSON.stringify({
          url: url,
          timestamp: Date.now(),
        }),
      })

      if (!response.ok) {
        console.error("ML API error:", response.status)
        return this.basicMaliciousCheck(url)
      }

      const result = await response.json()

      // Log for debugging
      console.log("ML API result:", result)

      return result.isMalicious || false
    } catch (error) {
      console.error("ML API error:", error)
      return this.basicMaliciousCheck(url)
    }
  }

  // Enhanced fallback detection
  basicMaliciousCheck(url) {
    const suspiciousPatterns = [
      // URL shorteners
      /bit\.ly|tinyurl|t\.co|goo\.gl|ow\.ly/i,

      // IP addresses instead of domains
      /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/,

      // Suspicious keywords
      /phishing|malware|virus|scam|hack|crack/i,

      // Suspicious TLDs
      /\.tk$|\.ml$|\.ga$|\.cf$/i,

      // Long random subdomains
      /[a-z0-9]{15,}\./i,

      // Multiple subdomains
      /([a-z0-9-]+\.){4,}/i,
    ]

    const isSuspicious = suspiciousPatterns.some((pattern) => pattern.test(url))

    if (isSuspicious) {
      console.log("Basic check flagged URL as suspicious:", url)
    }

    return isSuspicious
  }

  // Rest of your existing SafeGuardService code...
}

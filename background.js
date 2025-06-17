// Background service worker for URL checking and management
class SafeGuardService {
  constructor() {
    // Replace with your actual API keys
    this.googleSafeBrowsingApiKey = "YOUR_API_KEY" // ADD your GOOGLE SAVE BROWSING API KEY
    this.virusTotalApiKey = "YOUR_API_KEY" // Add your VirusTotal API key

    this.googleSafeBrowsingUrl = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${this.googleSafeBrowsingApiKey}`
    this.virusTotalUrl = "https://www.virustotal.com/vtapi/v2/url/report"

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
      "nude",
      "sex",
      "erotic",
      "mature",
    ]
    this.init()
  }

  init() {
    // Listen for navigation events
    chrome.webNavigation.onBeforeNavigate.addListener((details) => {
      if (details.frameId === 0) {
        // Main frame only
        this.checkURL(details.url, details.tabId)
      }
    })

    // Listen for messages from content scripts
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse)
      return true // Keep message channel open for async response
    })

    console.log("SafeGuard extension initialized with dual API protection")
  }

  async checkURL(url, tabId) {
    try {
      // Skip chrome:// and extension URLs
      if (url.startsWith("chrome://") || url.startsWith("chrome-extension://") || url.startsWith("moz-extension://")) {
        return
      }

      // Get current settings
      const settings = await this.getSettings()

      if (!settings.protectionEnabled) {
        return // Protection is disabled
      }

      // Check if URL is whitelisted
      const whitelist = await this.getWhitelist()
      const domain = new URL(url).hostname

      if (whitelist.includes(domain)) {
        return // Allow whitelisted domains
      }

      // Check if URL is in user-reported malicious list
      const reportedMalicious = await this.checkUserReportedMalicious(url)

      // Check for malicious URL using both APIs for enhanced accuracy
      const isMalicious = reportedMalicious || (await this.checkMaliciousURLDualAPI(url))

      // Check child mode if enabled
      const isInappropriate = settings.childMode ? this.checkChildMode(url) : false

      if (isMalicious || isInappropriate) {
        const blockReason = isMalicious ? "malicious" : "inappropriate"
        await this.blockPage(tabId, url, blockReason)
        await this.updateStats()
        await this.trackBlockedAccess(url, blockReason)
      }
    } catch (error) {
      console.error("Error checking URL:", error)
    }
  }

  async checkMaliciousURLDualAPI(url) {
    try {
      console.log("Checking URL with dual API protection:", url)

      // Run both API checks in parallel for faster response
      const [googleResult, virusTotalResult] = await Promise.allSettled([
        this.checkGoogleSafeBrowsing(url),
        this.checkVirusTotal(url),
      ])

      // Extract results, handling any API failures gracefully
      const googleMalicious = googleResult.status === "fulfilled" ? googleResult.value : false
      const virusTotalMalicious = virusTotalResult.status === "fulfilled" ? virusTotalResult.value : false

      // Log API results for debugging
      console.log("Google Safe Browsing result:", googleMalicious)
      console.log("VirusTotal result:", virusTotalMalicious)

      // If either API detects malicious content, block it
      const isMalicious = googleMalicious || virusTotalMalicious

      if (isMalicious) {
        const detectionSource =
          googleMalicious && virusTotalMalicious ? "Both APIs" : googleMalicious ? "Google Safe Browsing" : "VirusTotal"
        console.log(`Malicious URL detected by ${detectionSource}:`, url)

        // Store detection details for reporting
        await this.storeDetectionDetails(url, {
          google: googleMalicious,
          virusTotal: virusTotalMalicious,
          source: detectionSource,
          timestamp: Date.now(),
        })
      }

      return isMalicious
    } catch (error) {
      console.error("Dual API check error:", error)
      // Fallback to basic heuristics if both APIs fail
      return this.basicMaliciousCheck(url)
    }
  }

  async checkGoogleSafeBrowsing(url) {
    try {
      const requestBody = {
        client: {
          clientId: "safeguard-extension",
          clientVersion: "1.0.0",
        },
        threatInfo: {
          threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: [{ url: url }],
        },
      }

      const response = await fetch(this.googleSafeBrowsingUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        console.error("Google Safe Browsing API error:", response.status)
        throw new Error(`Google API error: ${response.status}`)
      }

      const result = await response.json()
      return result.matches && result.matches.length > 0
    } catch (error) {
      console.error("Google Safe Browsing API error:", error)
      throw error
    }
  }

  async checkVirusTotal(url) {
    try {
      // First, try to get existing report
      const params = new URLSearchParams({
        apikey: this.virusTotalApiKey,
        resource: url,
      })

      const response = await fetch(`${this.virusTotalUrl}?${params}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      })

      if (!response.ok) {
        console.error("VirusTotal API error:", response.status)
        throw new Error(`VirusTotal API error: ${response.status}`)
      }

      const result = await response.json()

      // Handle different response codes
      if (result.response_code === 1) {
        // URL found in database
        const positives = result.positives || 0
        const total = result.total || 1
        const detectionRatio = positives / total

        console.log(
          `VirusTotal: ${positives}/${total} engines detected threats (${(detectionRatio * 100).toFixed(1)}%)`,
        )

        // Consider malicious if more than 10% of scanners detect it
        // You can adjust this threshold based on your security requirements
        return detectionRatio > 0.1
      } else if (result.response_code === 0) {
        // URL not found in database, submit for scanning
        console.log("VirusTotal: URL not in database, submitting for scan")
        await this.submitURLToVirusTotal(url)
        return false // Don't block on first encounter, wait for scan results
      } else if (result.response_code === -2) {
        // URL queued for analysis
        console.log("VirusTotal: URL queued for analysis")
        return false
      } else {
        console.log("VirusTotal: Unknown response code", result.response_code)
        return false
      }
    } catch (error) {
      console.error("VirusTotal API error:", error)
      throw error
    }
  }

  async submitURLToVirusTotal(url) {
    try {
      const formData = new FormData()
      formData.append("apikey", this.virusTotalApiKey)
      formData.append("url", url)

      const response = await fetch("https://www.virustotal.com/vtapi/v2/url/scan", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        console.log("VirusTotal: URL submitted for scanning", result.scan_id)
      }
    } catch (error) {
      console.error("Error submitting URL to VirusTotal:", error)
    }
  }

  async storeDetectionDetails(url, details) {
    try {
      const detectionHistory = await chrome.storage.local.get({ detectionHistory: [] })

      detectionHistory.detectionHistory.push({
        url: url,
        domain: new URL(url).hostname,
        ...details,
      })

      // Keep only last 1000 detections to prevent storage bloat
      if (detectionHistory.detectionHistory.length > 1000) {
        detectionHistory.detectionHistory = detectionHistory.detectionHistory.slice(-1000)
      }

      await chrome.storage.local.set({ detectionHistory: detectionHistory.detectionHistory })
    } catch (error) {
      console.error("Error storing detection details:", error)
    }
  }

  async checkUserReportedMalicious(url) {
    const reportedSites = await chrome.storage.local.get({ reportedMaliciousSites: [] })
    const domain = new URL(url).hostname

    const isReported = reportedSites.reportedMaliciousSites.some(
      (site) => url.includes(site.domain) || site.url === url,
    )

    if (isReported) {
      console.log("User-reported malicious site blocked:", url)
    }

    return isReported
  }

  basicMaliciousCheck(url) {
    // Enhanced basic heuristic checks as fallback
    const suspiciousPatterns = [
      /bit\.ly|tinyurl|t\.co|goo\.gl|ow\.ly|short\.link/i, // URL shorteners
      /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, // IP addresses
      /[a-z0-9]{15,}\.com/i, // Long random domains
      /phishing|malware|virus|scam|hack|crack|warez/i, // Suspicious keywords
      /\.tk$|\.ml$|\.ga$|\.cf$|\.pw$/i, // Suspicious TLDs
      /([a-z0-9-]+\.){4,}/i, // Multiple subdomains
      /[0-9]{4,}-[0-9]{4,}/i, // Suspicious number patterns
      /free.*download.*crack|crack.*free.*download/i, // Crack/warez patterns
    ]

    const isSuspicious = suspiciousPatterns.some((pattern) => pattern.test(url))

    if (isSuspicious) {
      console.log("Basic heuristics flagged URL:", url)
    }

    return isSuspicious
  }

  checkChildMode(url) {
    const urlLower = url.toLowerCase()
    const isInappropriate = this.childModeKeywords.some((keyword) => urlLower.includes(keyword))

    if (isInappropriate) {
      console.log("Child mode blocked URL:", url)
    }

    return isInappropriate
  }

  async blockPage(tabId, url, reason) {
    const blockData = {
      url: url,
      reason: reason,
      timestamp: Date.now(),
    }

    // For inappropriate content, also store that child mode was active
    if (reason === "inappropriate") {
      const settings = await this.getSettings()
      blockData.childModeActive = settings.childMode
    }

    // Store block data for the blocked page
    await chrome.storage.local.set({
      [`blocked_${tabId}`]: blockData,
    })

    // Redirect to blocked page
    const blockedPageUrl = chrome.runtime.getURL("blocked.html") + `?tabId=${tabId}`
    chrome.tabs.update(tabId, { url: blockedPageUrl })

    console.log(`Blocked ${reason} URL:`, url)
  }

  async trackBlockedAccess(url, reason) {
    const domain = new URL(url).hostname
    const today = new Date().toDateString()

    // Get existing blocked sites history
    const history = await chrome.storage.local.get({
      blockedSitesHistory: [],
      dailyBlockedSites: {},
    })

    // Find existing entry for this domain
    let existingEntry = history.blockedSitesHistory.find((entry) => entry.domain === domain)

    if (existingEntry) {
      existingEntry.totalAttempts += 1
      existingEntry.lastAttempt = Date.now()
      existingEntry.urls.push({
        url: url,
        timestamp: Date.now(),
        reason: reason,
      })
    } else {
      // Create new entry
      existingEntry = {
        domain: domain,
        firstBlocked: Date.now(),
        lastAttempt: Date.now(),
        totalAttempts: 1,
        reason: reason,
        urls: [
          {
            url: url,
            timestamp: Date.now(),
            reason: reason,
          },
        ],
      }
      history.blockedSitesHistory.push(existingEntry)
    }

    // Track daily attempts
    if (!history.dailyBlockedSites[today]) {
      history.dailyBlockedSites[today] = {}
    }

    if (!history.dailyBlockedSites[today][domain]) {
      history.dailyBlockedSites[today][domain] = 0
    }

    history.dailyBlockedSites[today][domain] += 1

    // Save updated history
    await chrome.storage.local.set({
      blockedSitesHistory: history.blockedSitesHistory,
      dailyBlockedSites: history.dailyBlockedSites,
    })
  }

  async updateStats() {
    const today = new Date().toDateString()
    const stats = await chrome.storage.local.get({
      blockedToday: 0,
      totalBlocked: 0,
      lastResetDate: today,
    })

    // Reset daily counter if it's a new day
    if (stats.lastResetDate !== today) {
      stats.blockedToday = 0
      stats.lastResetDate = today
    }

    stats.blockedToday += 1
    stats.totalBlocked += 1

    await chrome.storage.local.set(stats)
  }

  async reportMaliciousSite(url, reportReason) {
    const domain = new URL(url).hostname
    const reportData = {
      url: url,
      domain: domain,
      reason: reportReason,
      timestamp: Date.now(),
      reportedBy: "user",
    }

    // Get existing reported sites
    const reported = await chrome.storage.local.get({ reportedMaliciousSites: [] })

    // Check if already reported
    const alreadyReported = reported.reportedMaliciousSites.some((site) => site.domain === domain || site.url === url)

    if (!alreadyReported) {
      reported.reportedMaliciousSites.push(reportData)
      await chrome.storage.local.set({ reportedMaliciousSites: reported.reportedMaliciousSites })
      console.log("Site reported as malicious:", url)
      return true
    }

    return false // Already reported
  }

  async handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case "getBlockData":
        const blockData = await chrome.storage.local.get(`blocked_${request.tabId}`)
        sendResponse(blockData[`blocked_${request.tabId}`] || null)
        break

      case "addToWhitelist":
        await this.addToWhitelist(request.domain)
        sendResponse({ success: true })
        break

      case "reportMaliciousSite":
        const reported = await this.reportMaliciousSite(request.url, request.reason)
        sendResponse({ success: reported, alreadyReported: !reported })
        break

      case "getSettings":
        const settings = await this.getSettings()
        sendResponse(settings)
        break

      case "updateSettings":
        await this.updateSettings(request.settings)
        sendResponse({ success: true })
        break

      case "getStats":
        const stats = await this.getStats()
        sendResponse(stats)
        break

      case "getBlockedSitesHistory":
        const history = await this.getBlockedSitesHistory()
        sendResponse(history)
        break

      case "getReportedSites":
        const reportedSites = await chrome.storage.local.get({ reportedMaliciousSites: [] })
        sendResponse(reportedSites.reportedMaliciousSites)
        break

      case "getDetectionHistory":
        const detectionHistory = await chrome.storage.local.get({ detectionHistory: [] })
        sendResponse(detectionHistory.detectionHistory)
        break

      case "getAPIStatus":
        const apiStatus = await this.checkAPIStatus()
        sendResponse(apiStatus)
        break
    }
  }

  async checkAPIStatus() {
    const status = {
      googleSafeBrowsing: false,
      virusTotal: false,
      timestamp: Date.now(),
    }

    try {
      // Test Google Safe Browsing API
      const testUrl = "http://malware.testing.google.test/testing/malware/"
      const googleResult = await this.checkGoogleSafeBrowsing(testUrl)
      status.googleSafeBrowsing = true
    } catch (error) {
      console.error("Google Safe Browsing API test failed:", error)
    }

    try {
      // Test VirusTotal API with a simple request
      const response = await fetch(`${this.virusTotalUrl}?apikey=${this.virusTotalApiKey}&resource=google.com`)
      status.virusTotal = response.ok
    } catch (error) {
      console.error("VirusTotal API test failed:", error)
    }

    return status
  }

  async getBlockedSitesHistory() {
    const history = await chrome.storage.local.get({
      blockedSitesHistory: [],
      dailyBlockedSites: {},
    })

    return {
      sites: history.blockedSitesHistory.sort((a, b) => b.lastAttempt - a.lastAttempt),
      dailyStats: history.dailyBlockedSites,
    }
  }

  async getSettings() {
    const result = await chrome.storage.sync.get({
      childMode: false,
      protectionEnabled: true,
    })
    return result
  }

  async updateSettings(settings) {
    await chrome.storage.sync.set(settings)
  }

  async getWhitelist() {
    const result = await chrome.storage.local.get({ whitelist: [] })
    return result.whitelist
  }

  async addToWhitelist(domain) {
    const whitelist = await this.getWhitelist()
    if (!whitelist.includes(domain)) {
      whitelist.push(domain)
      await chrome.storage.local.set({ whitelist })
      console.log("Added to whitelist:", domain)
    }
  }

  async getStats() {
    const today = new Date().toDateString()
    const stats = await chrome.storage.local.get({
      blockedToday: 0,
      totalBlocked: 0,
      lastResetDate: today,
    })

    // Reset daily counter if it's a new day
    if (stats.lastResetDate !== today) {
      stats.blockedToday = 0
      stats.lastResetDate = today
      await chrome.storage.local.set(stats)
    }

    return stats
  }
}

// Initialize the service
new SafeGuardService()

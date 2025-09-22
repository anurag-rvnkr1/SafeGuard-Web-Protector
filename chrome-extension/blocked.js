// Blocked page functionality
document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search)
  const tabId = urlParams.get("tabId")

  if (!tabId) {
    document.getElementById("blockMessage").textContent = "Invalid block request."
    return
  }

  try {
    // Get block data from background script
    const blockData = await new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          action: "getBlockData",
          tabId: Number.parseInt(tabId),
        },
        resolve,
      )
    })

    if (blockData) {
      displayBlockInfo(blockData)
      setupEventListeners(blockData)
      await loadDetectionSource(blockData.url)
    } else {
      document.getElementById("blockMessage").textContent = "Block information not found."
    }
  } catch (error) {
    console.error("Error loading block data:", error)
    document.getElementById("blockMessage").textContent = "Error loading block information."
  }
})

async function loadDetectionSource(url) {
  try {
    const detectionHistory = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: "getDetectionHistory" }, resolve)
    })

    // Find the most recent detection for this URL
    const detection = detectionHistory.filter((d) => d.url === url).sort((a, b) => b.timestamp - a.timestamp)[0]

    if (detection && detection.source) {
      document.getElementById("detectionSource").style.display = "block"
      document.getElementById("detectionSourceText").textContent = detection.source
    }
  } catch (error) {
    console.error("Error loading detection source:", error)
  }
}

function displayBlockInfo(blockData) {
  const { url, reason, timestamp } = blockData

  document.getElementById("blockedUrl").textContent = url
  document.getElementById("blockTime").textContent = new Date(timestamp).toLocaleString()

  // Set reason-specific content
  if (reason === "malicious") {
    document.getElementById("blockTitle").textContent = "Malicious Website Blocked"
    document.getElementById("blockReason").textContent = "Potentially malicious or phishing website"
    document.getElementById("detailsContent").innerHTML = `
            <p><strong>This website was blocked because:</strong></p>
            <ul>
                <li>🛡️ <strong>Google Safe Browsing</strong> and/or <strong>VirusTotal</strong> detected this as dangerous</li>
                <li>The site may be attempting to steal personal information</li>
                <li>It could contain malware or other harmful content</li>
                <li>The domain shows characteristics of phishing websites</li>
                <li>Multiple security engines flagged this URL as suspicious</li>
                <li>This site was reported as malicious by users</li>
            </ul>
            <p><strong>Our dual API protection includes:</strong></p>
            <ul>
                <li>🔍 <strong>Google Safe Browsing:</strong> Real-time threat detection</li>
                <li>🦠 <strong>VirusTotal:</strong> Multi-engine malware analysis</li>
                <li>👥 <strong>Community Reports:</strong> User-submitted threats</li>
                <li>🧠 <strong>Heuristic Analysis:</strong> Pattern-based detection</li>
            </ul>
            <p><strong>Stay safe by:</strong></p>
            <ul>
                <li>Not entering personal information on suspicious sites</li>
                <li>Verifying URLs before clicking links</li>
                <li>Using official websites for sensitive activities</li>
                <li>Keeping your browser and antivirus software updated</li>
            </ul>
        `
  } else if (reason === "inappropriate") {
    document.getElementById("blockTitle").textContent = "Inappropriate Content Blocked"
    document.getElementById("blockReason").textContent = "Child safety mode - inappropriate content"
    document.getElementById("detailsContent").innerHTML = `
            <p><strong>This website was blocked by Child Mode because:</strong></p>
            <ul>
                <li>The content may not be suitable for users under 18</li>
                <li>The site contains adult-oriented material</li>
                <li>It may include gambling, violence, or explicit content</li>
                <li>The URL contains keywords associated with mature content</li>
            </ul>
        `

    // Show child mode notice
    document.getElementById("childModeNotice").style.display = "block"

    // Hide the continue button for inappropriate content
    document.getElementById("continueAnyway").style.display = "none"

    // Hide report button for inappropriate content (not malicious)
    document.getElementById("reportSite").style.display = "none"
  }
}

function setupEventListeners(blockData) {
  // Go back button
  document.getElementById("goBack").addEventListener("click", () => {
    window.history.back()
  })

  // New tab button
  document.getElementById("newTab").addEventListener("click", () => {
    chrome.tabs.create({ url: "chrome://newtab/" })
    window.close()
  })

  // Continue anyway button - only show for malicious sites, not inappropriate content
  const continueButton = document.getElementById("continueAnyway")

  if (blockData.reason === "inappropriate") {
    // Hide continue button for inappropriate content (child mode)
    continueButton.style.display = "none"
  } else {
    // Show continue button for malicious sites
    continueButton.addEventListener("click", async () => {
      const domain = new URL(blockData.url).hostname

      const confirmed = confirm(
        `⚠️ SECURITY WARNING ⚠️\n\n` +
          `Are you absolutely sure you want to continue to ${domain}?\n\n` +
          `This site was flagged as malicious by our dual API protection system:\n` +
          `• Google Safe Browsing\n` +
          `• VirusTotal\n\n` +
          `Continuing may expose you to:\n` +
          `• Identity theft\n` +
          `• Malware infection\n` +
          `• Financial fraud\n\n` +
          `This will add the site to your whitelist and allow future access.\n` +
          `Only continue if you absolutely trust this website.`,
      )

      if (confirmed) {
        try {
          await new Promise((resolve) => {
            chrome.runtime.sendMessage(
              {
                action: "addToWhitelist",
                domain: domain,
              },
              resolve,
            )
          })

          // Show success message
          alert(
            `${domain} has been added to your whitelist. Redirecting...\n\nNote: This site will no longer be blocked by SafeGuard.`,
          )

          // Redirect to original URL
          window.location.href = blockData.url
        } catch (error) {
          console.error("Error adding to whitelist:", error)
          alert("Error adding site to whitelist. Please try again.")
        }
      }
    })
  }

  // Report site button - only show for malicious sites or if APIs failed to detect
  const reportButton = document.getElementById("reportSite")

  if (blockData.reason === "inappropriate") {
    reportButton.style.display = "none"
  } else {
    reportButton.addEventListener("click", () => {
      showReportModal(blockData.url)
    })
  }

  // Report false positive
  document.getElementById("reportFalsePositive").addEventListener("click", () => {
    const subject = encodeURIComponent("SafeGuard False Positive Report")
    const body = encodeURIComponent(
      `I believe the following URL was incorrectly blocked:\n\n` +
        `URL: ${blockData.url}\n` +
        `Reason: ${blockData.reason}\n` +
        `Time: ${new Date(blockData.timestamp).toLocaleString()}\n` +
        `Detection System: Dual API Protection (Google Safe Browsing + VirusTotal)\n\n` +
        `Additional details:\n`,
    )

    window.open(`mailto:support@example.com?subject=${subject}&body=${body}`)
  })

  // Modal event listeners
  setupModalEventListeners()
}

function showReportModal(url) {
  document.getElementById("reportUrl").textContent = url
  document.getElementById("reportModal").style.display = "flex"
}

function hideReportModal() {
  document.getElementById("reportModal").style.display = "none"
  document.getElementById("reportReason").value = "phishing"
  document.getElementById("reportDetails").value = ""
}

function setupModalEventListeners() {
  // Close modal
  document.getElementById("closeModal").addEventListener("click", hideReportModal)
  document.getElementById("cancelReport").addEventListener("click", hideReportModal)

  // Click outside modal to close
  document.getElementById("reportModal").addEventListener("click", (e) => {
    if (e.target.id === "reportModal") {
      hideReportModal()
    }
  })

  // Submit report
  document.getElementById("submitReport").addEventListener("click", async () => {
    const url = document.getElementById("reportUrl").textContent
    const reason = document.getElementById("reportReason").value
    const details = document.getElementById("reportDetails").value

    try {
      const result = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          {
            action: "reportMaliciousSite",
            url: url,
            reason: reason,
            details: details,
          },
          resolve,
        )
      })

      if (result.success) {
        alert(
          "✅ Thank you for your report!\n\n" +
            "This site has been added to our community threat database and will be blocked for all users.\n\n" +
            "Your contribution helps make the internet safer for everyone.",
        )
        hideReportModal()
      } else if (result.alreadyReported) {
        alert("ℹ️ This site has already been reported as malicious by the community.")
        hideReportModal()
      } else {
        alert("❌ Error reporting site. Please try again.")
      }
    } catch (error) {
      console.error("Error reporting site:", error)
      alert("❌ Error reporting site. Please try again.")
    }
  })
}

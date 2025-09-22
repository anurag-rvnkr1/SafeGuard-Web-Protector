// Popup functionality
document.addEventListener("DOMContentLoaded", async () => {
  await loadSettings()
  await loadStats()
  await loadAPIStatus()
  setupEventListeners()
})

async function loadSettings() {
  try {
    const settings = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: "getSettings" }, resolve)
    })

    document.getElementById("protectionEnabled").checked = settings.protectionEnabled
    document.getElementById("childMode").checked = settings.childMode

    updateStatusIndicator(settings.protectionEnabled)
  } catch (error) {
    console.error("Error loading settings:", error)
  }
}

async function loadStats() {
  try {
    const stats = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: "getStats" }, resolve)
    })

    document.getElementById("blockedToday").textContent = stats.blockedToday || 0
    document.getElementById("totalBlocked").textContent = stats.totalBlocked || 0
  } catch (error) {
    console.error("Error loading stats:", error)
  }
}

async function loadAPIStatus() {
  try {
    const apiStatus = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: "getAPIStatus" }, resolve)
    })

    const googleStatusElement = document.getElementById("googleStatus")
    const virusTotalStatusElement = document.getElementById("virusTotalStatus")

    // Update Google Safe Browsing status
    if (apiStatus.googleSafeBrowsing) {
      googleStatusElement.classList.add("online")
      googleStatusElement.classList.remove("offline")
      googleStatusElement.title = "Google Safe Browsing API is online"
    } else {
      googleStatusElement.classList.add("offline")
      googleStatusElement.classList.remove("online")
      googleStatusElement.title = "Google Safe Browsing API is offline"
    }

    // Update VirusTotal status
    if (apiStatus.virusTotal) {
      virusTotalStatusElement.classList.add("online")
      virusTotalStatusElement.classList.remove("offline")
      virusTotalStatusElement.title = "VirusTotal API is online"
    } else {
      virusTotalStatusElement.classList.add("offline")
      virusTotalStatusElement.classList.remove("online")
      virusTotalStatusElement.title = "VirusTotal API is offline"
    }
  } catch (error) {
    console.error("Error loading API status:", error)
  }
}

function setupEventListeners() {
  // Protection toggle
  document.getElementById("protectionEnabled").addEventListener("change", async (e) => {
    const enabled = e.target.checked
    await updateSetting("protectionEnabled", enabled)
    updateStatusIndicator(enabled)
  })

  // Child mode toggle
  document.getElementById("childMode").addEventListener("change", async (e) => {
    const enabled = e.target.checked
    await updateSetting("childMode", enabled)
  })

  // View history button
  document.getElementById("viewHistory").addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("history.html") })
    window.close()
  })

  // (Removed legacy open-page handlers. The buttons now report the active page.)

  // Report as Safe button
  document.getElementById("viewWhitelist").addEventListener("click", async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      const url = tab?.url
      if (!url) return alert('No active tab URL found')

      // Send message to background to report as safe
      chrome.runtime.sendMessage({ action: 'reportCurrentAsSafe', url }, (resp) => {
        if (resp && resp.success) {
          alert('Reported as safe and saved to database')
        } else {
          alert('Report submitted (may already exist)')
        }
      })
    } catch (err) {
      console.error('Error reporting as safe:', err)
      alert('Failed to report as safe')
    }
    window.close()
  })

  // Report as Malicious button
  document.getElementById("viewReported").addEventListener("click", async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      const url = tab?.url
      if (!url) return alert('No active tab URL found')

      // Send message to background to report as malicious
      chrome.runtime.sendMessage({ action: 'reportCurrentAsMalicious', url }, (resp) => {
        if (resp && resp.success) {
          alert('Reported as malicious and saved to database')
        } else {
          alert('Report submitted (may already exist)')
        }
      })
    } catch (err) {
      console.error('Error reporting as malicious:', err)
      alert('Failed to report as malicious')
    }
    window.close()
  })

  // Help link
  document.getElementById("helpLink").addEventListener("click", (e) => {
    e.preventDefault()
    chrome.tabs.create({ url: "https://github.com/safeguard-extension/help" })
    window.close()
  })
}

async function updateSetting(key, value) {
  try {
    const settings = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: "getSettings" }, resolve)
    })

    settings[key] = value

    await new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          action: "updateSettings",
          settings: settings,
        },
        resolve,
      )
    })
  } catch (error) {
    console.error("Error updating setting:", error)
  }
}

function updateStatusIndicator(enabled) {
  const statusIndicator = document.getElementById("statusIndicator")
  const statusDot = statusIndicator.querySelector(".status-dot")
  const statusText = statusIndicator.querySelector("span:last-child")

  if (enabled) {
    statusDot.classList.add("active")
    statusText.textContent = "Active"
  } else {
    statusDot.classList.remove("active")
    statusText.textContent = "Disabled"
  }
}

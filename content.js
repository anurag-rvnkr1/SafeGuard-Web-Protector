// Content script for immediate page blocking
;(() => {
  // Check if this is our blocked page
  if (window.location.href.includes(chrome.runtime.getURL("blocked.html"))) {
    return
  }

  // Immediate blocking mechanism
  let isBlocked = false

  function blockPageImmediately() {
    if (isBlocked) return
    isBlocked = true

    // Hide all content immediately
    if (document.documentElement) {
      document.documentElement.style.display = "none"
    }

    // Stop all scripts
    const scripts = document.querySelectorAll("script")
    scripts.forEach((script) => {
      try {
        script.remove()
      } catch (e) {
        // Ignore errors
      }
    })

    // Clear the page content
    if (document.body) {
      document.body.innerHTML = ""
    }

    if (document.head) {
      document.head.innerHTML = "<title>Page Blocked</title>"
    }
  }

  // Listen for block commands from background script
  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "blockPage") {
        blockPageImmediately()
        sendResponse({ blocked: true })
      }
    })
  }

  // Prevent navigation to blocked content
  window.addEventListener("beforeunload", (e) => {
    if (isBlocked) {
      e.preventDefault()
      e.returnValue = ""
    }
  })

  // Monitor for dynamic content changes
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      // Additional protection after DOM loads
    })
  }
})()

"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

export function BackendStatus() {
  const [status, setStatus] = useState<"checking" | "online" | "offline">("checking")
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  const checkBackendStatus = async () => {
    setStatus("checking")
    try {
      const response = await fetch("http://localhost:8000/", {
        method: "GET",
        signal: AbortSignal.timeout(5000), // 5 second timeout
      })

      if (response.ok) {
        setStatus("online")
      } else {
        setStatus("offline")
      }
    } catch (error) {
      setStatus("offline")
    }
    setLastCheck(new Date())
  }

  useEffect(() => {
    checkBackendStatus()
    // Check every 30 seconds
    const interval = setInterval(checkBackendStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  if (status === "online") {
    return null // Don't show anything if backend is online
  }

  return (
    <Alert className={`mb-4 ${status === "offline" ? "border-red-500 bg-red-50" : "border-yellow-500 bg-yellow-50"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {status === "checking" ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
          )}
          <AlertDescription>
            {status === "checking" ? (
              "Checking backend connection..."
            ) : (
              <>
                <strong>Backend server is offline</strong>
                <br />
                Please start the backend server:{" "}
                <code className="bg-gray-200 px-1 rounded">python backend/main.py</code>
                {lastCheck && (
                  <div>
                    <br />
                    <small className="text-gray-500">Last checked: {lastCheck.toLocaleTimeString()}</small>
                  </div>
                )}
              </>
            )}
          </AlertDescription>
        </div>
        <Button variant="outline" size="sm" onClick={checkBackendStatus} disabled={status === "checking"}>
          <RefreshCw className={`h-4 w-4 mr-1 ${status === "checking" ? "animate-spin" : ""}`} />
          Retry
        </Button>
      </div>
    </Alert>
  )
}

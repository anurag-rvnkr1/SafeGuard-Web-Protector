"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell } from "recharts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, AlertTriangle, CheckCircle, Globe, Lock, Users, Cpu, RefreshCw, Settings, Zap, Activity, TrendingUp, Eye, Database, Wifi, WifiOff, Clock, Server, BarChart3, PieChart as PieChartIcon, Layers, MonitorSpeaker } from "lucide-react"

interface URLResult {
  url: string
  prediction: string
  confidence: number
  reason: string
  threat_feed_result?: any
  child_mode_result?: any
}

interface HistoryItem extends URLResult {
  checked_at: string
}

// Enhanced BackendStatus component with automation-style indicators
const BackendStatus = () => {
  const [status, setStatus] = useState<boolean | null>(null)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)
  const [responseTime, setResponseTime] = useState<number>(0)

  useEffect(() => {
    const checkStatus = async () => {
      const startTime = Date.now()
      try {
        const res = await fetch("http://localhost:8000/", { method: "GET" })
        const endTime = Date.now()
        setStatus(res.ok)
        setResponseTime(endTime - startTime)
        setLastCheck(new Date())
      } catch {
        setStatus(false)
        setResponseTime(0)
        setLastCheck(new Date())
      }
    }
    
    checkStatus()
    const interval = setInterval(checkStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex items-center space-x-3 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-2"
    >
      <motion.div
        animate={{ 
          scale: status ? [1, 1.3, 1] : [1, 0.8, 1],
          opacity: status === null ? 0.5 : 1
        }}
        transition={{ duration: 2, repeat: Infinity }}
        className={`w-3 h-3 rounded-full ${
          status === null 
            ? 'bg-slate-500' 
            : status 
            ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' 
            : 'bg-red-400 shadow-lg shadow-red-400/50'
        }`}
      />
      <div className="flex items-center space-x-2">
        <Server className={`h-4 w-4 ${status ? 'text-emerald-400' : 'text-red-400'}`} />
        <span className={`font-semibold text-sm ${status ? 'text-emerald-400' : 'text-red-400'}`}>
          Backend {status === null ? 'Checking...' : status ? 'Online' : 'Offline'}
        </span>
        {status && (
          <span className="text-xs text-slate-400">
            {responseTime}ms
          </span>
        )}
      </div>
    </motion.div>
  )
}

// Automation-style Statistics Cards
const StatCard = ({ title, value, icon: Icon, trend, color, delay = 0 }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.6, type: "spring" }}
    whileHover={{ scale: 1.02, y: -2 }}
  >
    <Card className="bg-slate-900/70 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">{title}</p>
            <div className="flex items-baseline space-x-2">
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
              {trend && (
                <span className={`text-sm font-medium ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {trend > 0 ? '+' : ''}{trend}%
                </span>
              )}
            </div>
          </div>
          <motion.div
            className={`p-4 rounded-2xl bg-gradient-to-br from-white/10 to-transparent group-hover:scale-110 transition-transform duration-300`}
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Icon className={`h-8 w-8 ${color}`} />
          </motion.div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
)

export default function HomePage() {
  // Core state
  const [url, setUrl] = useState("")
  const [result, setResult] = useState<URLResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [childMode, setChildMode] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])

  // Enhanced customization
  const [accent, setAccent] = useState<string>("neon")

  // Health polling
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null)
  const healthRef = useRef<number | null>(null)

  // Scroll animations
  const { scrollY } = useScroll()
  const headerY = useTransform(scrollY, [0, 300], [0, -50])
  const headerOpacity = useTransform(scrollY, [0, 300], [1, 0.8])

  // Load saved data
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem("safeguard_history_v1")
      if (savedHistory) setHistory(JSON.parse(savedHistory))
      
      const savedAccent = localStorage.getItem("safeguard_accent")
      if (savedAccent) setAccent(savedAccent)
    } catch (e) {
      console.warn("Failed to load saved settings:", e)
    }
  }, [])

  // Save data when changed
  useEffect(() => {
    localStorage.setItem("safeguard_history_v1", JSON.stringify(history.slice(0, 200)))
  }, [history])

  useEffect(() => {
    localStorage.setItem("safeguard_accent", accent)
  }, [accent])

  // Health check polling
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("http://localhost:8000/", { method: "GET" })
        setBackendHealthy(res.ok)
      } catch (e) {
        setBackendHealthy(false)
      }
    }
    check()
    healthRef.current = window.setInterval(check, 5000)
    return () => {
      if (healthRef.current) clearInterval(healthRef.current)
    }
  }, [])

  const addToHistory = (r: URLResult) => {
    const item: HistoryItem = { ...r, checked_at: new Date().toISOString() }
    setHistory((s) => [item, ...s].slice(0, 200))
  }

  const checkURL = async () => {
    if (!url) return

    setLoading(true)
    try {
      const healthCheck = await fetch("http://localhost:8000/", { method: "GET" }).catch(() => null)

      if (!healthCheck) {
        alert("Backend server is not running. Please start the backend server first.\n\nRun: python backend/main.py")
        setLoading(false)
        return
      }

      const response = await fetch("http://localhost:8000/predict-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url, child_mode: childMode }),
      })

      if (response.ok) {
        const data = await response.json()
        setResult(data)
        addToHistory(data)
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Error checking URL" }))
        alert(errorData.detail || "Error checking URL")
      }
    } catch (error) {
      console.error("Error:", error)
      alert(
        "Cannot connect to backend server. Please ensure:\n\n1. Backend server is running (python backend/main.py)\n2. Server is accessible at http://localhost:8000",
      )
    } finally {
      setLoading(false)
    }
  }

  const reportURL = async (reportType: string) => {
    if (!result) return

    try {
      const endpoint = reportType === "false_positive" ? "report-valid" : "report-malicious"
      const response = await fetch(`http://localhost:8000/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: result.url, report_type: reportType }),
      })

      if (response.ok) {
        alert("Report submitted successfully!")
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Error submitting report" }))
        alert(errorData.detail || "Error submitting report")
      }
    } catch (error) {
      console.error("Error reporting URL:", error)
      alert("Cannot connect to backend server. Please ensure the backend is running.")
    }
  }

  const getPredictionColor = (prediction: string) => {
    switch (prediction) {
      case "safe":
        return "bg-gradient-to-r from-emerald-500 via-green-500 to-teal-400 text-white shadow-2xl shadow-emerald-500/40"
      case "malicious":
        return "bg-gradient-to-r from-red-500 via-rose-500 to-pink-400 text-white shadow-2xl shadow-red-500/40"
      case "blocked":
        return "bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400 text-white shadow-2xl shadow-amber-500/40"
      default:
        return "bg-gradient-to-r from-slate-500 to-gray-400 text-white"
    }
  }

  const getPredictionIcon = (prediction: string) => {
    switch (prediction) {
      case "safe":
        return <CheckCircle className="h-5 w-5" />
      case "malicious":
        return <AlertTriangle className="h-5 w-5" />
      case "blocked":
        return <Lock className="h-5 w-5" />
      default:
        return <Globe className="h-5 w-5" />
    }
  }

  // Enhanced statistics calculations
  const statistics = useMemo(() => {
    const total = history.length
    const safe = history.filter(h => h.prediction === "safe").length
    const malicious = history.filter(h => h.prediction === "malicious").length
    const blocked = history.filter(h => h.prediction === "blocked").length
    const avgConfidence = history.length > 0 
      ? history.reduce((sum, h) => sum + h.confidence, 0) / history.length 
      : 0

    return {
      total,
      safe,
      malicious,
      blocked,
      avgConfidence: (avgConfidence * 100).toFixed(1),
      safeRate: total > 0 ? ((safe / total) * 100).toFixed(1) : "0",
      threatRate: total > 0 ? (((malicious + blocked) / total) * 100).toFixed(1) : "0"
    }
  }, [history])

  // Enhanced chart data
  const chartData = useMemo(() => {
    const map = new Map<string, { safe: number; malicious: number; blocked: number; total: number }>()
    history.slice(0, 50).reverse().forEach((h) => {
      const d = new Date(h.checked_at)
      const label = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`
      const cur = map.get(label) || { safe: 0, malicious: 0, blocked: 0, total: 0 }
      if (h.prediction === "safe") cur.safe++
      else if (h.prediction === "malicious") cur.malicious++
      else cur.blocked++
      cur.total++
      map.set(label, cur)
    })
    return Array.from(map.entries()).map(([name, counts]) => ({ name, ...counts })).slice(-20)
  }, [history])

  // Pie chart data
  const pieData = [
    { name: 'Safe', value: statistics.safe, color: '#10b981' },
    { name: 'Malicious', value: statistics.malicious, color: '#ef4444' },
    { name: 'Blocked', value: statistics.blocked, color: '#f59e0b' }
  ].filter(item => item.value > 0)

  const exportHistoryCSV = () => {
    const rows = ["checked_at,url,prediction,confidence,reason"]
    for (const h of history) {
      rows.push(
        `${h.checked_at},"${h.url.replace(/"/g, '""')}",${h.prediction},${h.confidence},"${(h.reason || "").replace(/"/g, '""')}"`,
      )
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv" })
    const urlBlob = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = urlBlob
    a.download = `safeguard_history_${new Date().toISOString()}.csv`
    a.click()
    URL.revokeObjectURL(urlBlob)
  }

  // Enhanced theme system
  const accentClasses = {
    neon: {
      bg: "from-black via-slate-900 to-black",
      accent: "from-cyan-400 via-blue-500 to-purple-600",
      card: "bg-slate-900/80 border-cyan-500/30 backdrop-blur-xl shadow-2xl shadow-cyan-500/10",
      text: "text-cyan-400",
      glow: "shadow-cyan-500/50"
    },
    electric: {
      bg: "from-black via-purple-900/50 to-black",
      accent: "from-purple-400 via-pink-500 to-rose-500",
      card: "bg-slate-900/80 border-purple-500/30 backdrop-blur-xl shadow-2xl shadow-purple-500/10",
      text: "text-purple-400",
      glow: "shadow-purple-500/50"
    },
    matrix: {
      bg: "from-black via-green-900/30 to-black",
      accent: "from-emerald-400 via-green-500 to-teal-500",
      card: "bg-slate-900/80 border-emerald-500/30 backdrop-blur-xl shadow-2xl shadow-emerald-500/10",
      text: "text-emerald-400",
      glow: "shadow-emerald-500/50"
    }
  }

  const currentTheme = accentClasses[accent as keyof typeof accentClasses] || accentClasses.neon

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentTheme.bg} relative overflow-hidden`}>
      {/* Enhanced animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl"
          animate={{ 
            x: [0, 100, 0], 
            y: [0, -50, 0],
            scale: [1, 1.3, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"
          animate={{ 
            x: [0, -80, 0], 
            y: [0, 60, 0],
            scale: [1, 0.8, 1.2, 1],
            rotate: [360, 180, 0]
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

      <div className="container mx-auto px-6 py-8 relative z-10 max-w-7xl">
        {/* Header Section */}
        <motion.div 
          className="flex flex-col lg:flex-row items-center justify-between mb-12"
          style={{ y: headerY, opacity: headerOpacity }}
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center space-x-6 mb-6 lg:mb-0">
            <motion.div 
              initial={{ scale: 0.8, rotate: -180 }} 
              animate={{ scale: 1, rotate: 0 }} 
              transition={{ duration: 1, type: "spring", bounce: 0.6 }}
              whileHover={{ 
                scale: 1.1, 
                rotate: [0, -10, 10, 0],
                boxShadow: "0 0 30px rgba(34, 211, 238, 0.6)"
              }}
            >
              <div className={`p-5 rounded-3xl bg-gradient-to-r ${currentTheme.accent} shadow-2xl ${currentTheme.glow}`}>
                <Shield className="h-12 w-12 text-white" />
              </div>
            </motion.div>
            <div>
              <motion.h1 
                className="text-6xl md:text-7xl font-black bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                Safeguard
              </motion.h1>
              <motion.p 
                className="text-gray-300 font-semibold text-xl mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                Automated URL Security Intelligence Platform
              </motion.p>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <BackendStatus />
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="ghost" 
                onClick={() => window.location.href = '/admin'} 
                className={`text-white hover:text-white hover:bg-white/20 backdrop-blur-sm border border-white/20 px-6 py-3 text-lg font-semibold transition-all duration-300 ${currentTheme.glow}`}
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Lock className="h-6 w-6 mr-2" />
                </motion.div>
                Admin Login
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Statistics Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard 
            title="Total Scans" 
            value={statistics.total} 
            icon={Database} 
            color="text-cyan-400" 
            delay={0.1}
          />
          <StatCard 
            title="Safe URLs" 
            value={statistics.safe} 
            icon={CheckCircle} 
            color="text-emerald-400" 
            delay={0.2}
          />
          <StatCard 
            title="Threats Detected" 
            value={statistics.malicious + statistics.blocked} 
            icon={AlertTriangle} 
            color="text-red-400" 
            delay={0.3}
          />
          <StatCard 
            title="Avg Confidence" 
            value={`${statistics.avgConfidence}%`} 
            icon={Activity} 
            color="text-purple-400" 
            delay={0.4}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-12">
          {/* URL Scanner - Left Column */}
          <motion.div 
            className="xl:col-span-5"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <Card className="bg-slate-900/70 backdrop-blur-xl border-white/10 shadow-2xl h-full">
              <CardHeader className="bg-gradient-to-r from-white/10 via-white/5 to-transparent pb-6">
                <CardTitle className="flex items-center text-white text-2xl font-bold">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    <Globe className="h-7 w-7 mr-4" />
                  </motion.div>
                  URL Security Scanner
                </CardTitle>
                <CardDescription className="text-gray-300 text-lg">
                  Advanced malicious URL detection with real-time threat intelligence
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 p-8">
                <div className="space-y-6">
                  <div className="flex space-x-4">
                    <Input
                      placeholder="https://example.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && checkURL()}
                      className="flex-1 bg-slate-800/80 border-slate-600 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-cyan-400/30 h-14 text-lg backdrop-blur-sm transition-all duration-300 rounded-xl"
                    />
                    <motion.div 
                      whileHover={{ scale: 1.02 }} 
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button 
                        onClick={checkURL} 
                        disabled={loading || !url}
                        className={`bg-gradient-to-r ${currentTheme.accent} hover:shadow-2xl transition-all duration-300 font-bold h-14 px-8 rounded-xl shadow-xl disabled:opacity-50`}
                      >
                        {loading ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <RefreshCw className="h-6 w-6 mr-3" />
                            </motion.div>
                            Scanning...
                          </>
                        ) : (
                          <>
                            <Zap className="h-6 w-6 mr-3" /> Scan URL
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </div>

                  <motion.div 
                    className="flex items-center space-x-4 p-5 rounded-xl bg-gradient-to-r from-slate-800/70 to-slate-700/70 backdrop-blur-xl border border-white/10"
                    whileHover={{ scale: 1.01 }}
                  >
                    <motion.input
                      type="checkbox"
                      id="childMode"
                      checked={childMode}
                      onChange={(e) => setChildMode(e.target.checked)}
                      className="w-6 h-6 text-cyan-600 bg-slate-700 border-slate-600 rounded-lg focus:ring-cyan-500 focus:ring-2"
                      whileHover={{ scale: 1.1 }}
                    />
                    <label htmlFor="childMode" className="text-white font-semibold cursor-pointer select-none text-lg">
                      Enable Child Mode Protection
                    </label>
                  </motion.div>
                </div>

                <AnimatePresence mode="wait">
                  {result && (
                    <motion.div 
                      initial={{ opacity: 0, y: 30, scale: 0.9 }} 
                      animate={{ opacity: 1, y: 0, scale: 1 }} 
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.5, type: "spring" }}
                      className="space-y-6"
                    >
                      <Alert
                        className={`border-0 shadow-2xl backdrop-blur-xl overflow-hidden rounded-2xl ${
                          result.prediction === "safe"
                            ? "bg-gradient-to-r from-emerald-900/90 to-green-800/90 border-l-8 border-emerald-400"
                            : result.prediction === "malicious"
                            ? "bg-gradient-to-r from-red-900/90 to-rose-800/90 border-l-8 border-red-400"
                            : "bg-gradient-to-r from-amber-900/90 to-orange-800/90 border-l-8 border-amber-400"
                        }`}
                      >
                        <div className="p-2">
                          <div className="flex items-center space-x-4 mb-4">
                            <motion.div
                              animate={{ 
                                rotate: result.prediction === "safe" ? 0 : [0, -10, 10, 0],
                                scale: [1, 1.1, 1]
                              }}
                              transition={{ duration: 0.6, repeat: result.prediction !== "safe" ? Infinity : 0 }}
                            >
                              {getPredictionIcon(result.prediction)}
                            </motion.div>
                            <Badge className={`${getPredictionColor(result.prediction)} px-4 py-2 text-sm font-bold`}>
                              {result.prediction.toUpperCase()}
                            </Badge>
                            <div className="flex items-center space-x-2">
                              <TrendingUp className="h-5 w-5 text-white" />
                              <span className="text-xl text-white font-bold">
                                {(result.confidence * 100).toFixed(1)}% Confidence
                              </span>
                            </div>
                          </div>
                          <AlertDescription className="text-gray-100 space-y-4">
                            <div className="grid grid-cols-1 gap-3">
                              <div className="bg-black/30 rounded-lg p-4">
                                <span className="text-white font-semibold text-lg block mb-2">URL:</span>
                                <span className="font-mono text-sm bg-slate-800 px-3 py-2 rounded break-all">{result.url}</span>
                              </div>
                              <div className="bg-black/30 rounded-lg p-4">
                                <span className="text-white font-semibold text-lg block mb-2">Analysis:</span>
                                <span className="text-base">{result.reason}</span>
                              </div>
                            </div>
                          </AlertDescription>
                        </div>
                      </Alert>

                      {/* Action buttons */}
                      <div className="flex space-x-4">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant="outline"
                            onClick={() => reportURL("false_positive")}
                            className="bg-emerald-600/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-600/40 backdrop-blur-sm shadow-lg font-semibold px-6 py-3"
                          >
                            <CheckCircle className="h-5 w-5 mr-2" />
                            Report as Safe
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant="outline"
                            onClick={() => reportURL("false_negative")}
                            className="bg-red-600/20 text-red-300 border-red-500/50 hover:bg-red-600/40 backdrop-blur-sm shadow-lg font-semibold px-6 py-3"
                          >
                            <AlertTriangle className="h-5 w-5 mr-2" />
                            Report as Malicious
                          </Button>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          {/* Analytics Dashboard - Right Column */}
          <motion.div 
            className="xl:col-span-7"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
              {/* Real-time Chart */}
              <Card className="bg-slate-900/70 backdrop-blur-xl border-white/10 shadow-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center text-white text-xl">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <BarChart3 className="h-6 w-6 mr-3 text-cyan-400" />
                    </motion.div>
                    Real-time Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="safeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="maliciousGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                      <YAxis stroke="#9ca3af" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: '1px solid #374151',
                          borderRadius: '12px',
                          color: 'white'
                        }} 
                      />
                      <Area type="monotone" dataKey="safe" stackId="1" stroke="#10b981" fill="url(#safeGradient)" />
                      <Area type="monotone" dataKey="malicious" stackId="1" stroke="#ef4444" fill="url(#maliciousGradient)" />
                      <Area type="monotone" dataKey="blocked" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Threat Distribution */}
              <Card className="bg-slate-900/70 backdrop-blur-xl border-white/10 shadow-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center text-white text-xl">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    >
                      <PieChartIcon className="h-6 w-6 mr-3 text-purple-400" />
                    </motion.div>
                    Threat Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1e293b', 
                            border: '1px solid #374151',
                            borderRadius: '12px',
                            color: 'white'
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* System Metrics */}
              <Card className="bg-slate-900/70 backdrop-blur-xl border-white/10 shadow-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center text-white text-xl">
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Cpu className="h-6 w-6 mr-3 text-emerald-400" />
                    </motion.div>
                    System Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-gray-300 font-medium">Detection Rate</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                            initial={{ width: 0 }}
                            animate={{ width: `${statistics.threatRate}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                          />
                        </div>
                        <span className="text-white font-semibold text-sm">{statistics.threatRate}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-gray-300 font-medium">Safe Rate</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-gradient-to-r from-green-400 to-emerald-400"
                            initial={{ width: 0 }}
                            animate={{ width: `${statistics.safeRate}%` }}
                            transition={{ duration: 1, delay: 0.7 }}
                          />
                        </div>
                        <span className="text-white font-semibold text-sm">{statistics.safeRate}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-gray-300 font-medium">Backend Status</span>
                      <Badge className={backendHealthy ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}>
                        {backendHealthy ? "Online" : "Offline"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-slate-900/70 backdrop-blur-xl border-white/10 shadow-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center text-white text-xl">
                    <motion.div
                      animate={{ rotate: [0, 90, 180, 270, 360] }}
                      transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                    >
                      <Layers className="h-6 w-6 mr-3 text-amber-400" />
                    </motion.div>
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={exportHistoryCSV}
                      className="w-full bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 backdrop-blur-sm h-12 font-semibold transition-all duration-300"
                    >
                      <Database className="h-5 w-5 mr-2" />
                      Export History (CSV)
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={() => setHistory([])}
                      variant="outline"
                      className="w-full bg-gradient-to-r from-red-600/20 to-rose-600/20 text-red-300 border border-red-500/30 hover:bg-red-600/30 backdrop-blur-sm h-12 font-semibold transition-all duration-300"
                    >
                      <RefreshCw className="h-5 w-5 mr-2" />
                      Clear History
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>

        {/* Scan History Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          <Card className="bg-slate-900/70 backdrop-blur-xl border-white/10 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-white/10 via-white/5 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  >
                    <Clock className="h-7 w-7 text-cyan-400" />
                  </motion.div>
                  <div>
                    <CardTitle className="text-white text-2xl font-bold">Scan History</CardTitle>
                    <CardDescription className="text-gray-300 text-lg">
                      Complete audit trail of all URL security scans
                    </CardDescription>
                  </div>
                </div>
                <Badge className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/50 px-4 py-2 text-lg font-semibold">
                  {history.length} Total Scans
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              {history.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                  {history.slice(0, 20).map((item, index) => (
                    <motion.div
                      key={`${item.url}-${item.checked_at}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.5 }}
                      whileHover={{ scale: 1.01, x: 5 }}
                      className="flex items-center justify-between p-5 rounded-xl bg-gradient-to-r from-slate-800/70 to-slate-700/70 backdrop-blur-sm border border-white/5 hover:border-white/20 transition-all duration-300"
                    >
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <motion.div
                          animate={{ 
                            rotate: item.prediction === "safe" ? 0 : [0, 10, -10, 0],
                            scale: [1, 1.1, 1]
                          }}
                          transition={{ 
                            duration: item.prediction === "safe" ? 0 : 2, 
                            repeat: item.prediction === "safe" ? 0 : Infinity 
                          }}
                        >
                          {getPredictionIcon(item.prediction)}
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <Badge className={`${getPredictionColor(item.prediction)} px-3 py-1 text-sm font-bold`}>
                              {item.prediction.toUpperCase()}
                            </Badge>
                            <span className="text-gray-400 text-sm font-medium">
                              {(item.confidence * 100).toFixed(1)}% confidence
                            </span>
                          </div>
                          <p className="text-white font-mono text-sm truncate mb-1">
                            {item.url}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {new Date(item.checked_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <motion.div
                          whileHover={{ scale: 1.2, rotate: 360 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Eye className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-16"
                >
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="mx-auto mb-6"
                  >
                    <Globe className="h-16 w-16 text-gray-500 mx-auto" />
                  </motion.div>
                  <p className="text-gray-400 text-xl font-medium">No scans performed yet</p>
                  <p className="text-gray-500 mt-2">Start by entering a URL above to begin scanning</p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(51, 65, 85, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(34, 211, 238, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(34, 211, 238, 0.7);
        }
      `}</style>
    </div>
  )
}
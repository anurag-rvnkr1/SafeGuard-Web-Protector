"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shield, Users, AlertTriangle, CheckCircle, Plus, Trash2, RefreshCw, BarChart3, ArrowLeft, Search, ChevronLeft, ChevronRight } from "lucide-react"

interface AdminStats {
  malicious_count: number
  valid_count: number
  pending_reports: number
  blocked_today: number
}

interface URLData {
  id: number
  url: string
  source: string
  date_added: string
  verified: boolean
}

interface Report {
  id: number
  url: string
  report_type: string
  status: string
  date_reported: string
}

// Simple table components since they're not available in the environment
const Table = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`w-full ${className}`}>
    <table className="w-full caption-bottom text-sm">
      {children}
    </table>
  </div>
)

const TableHeader = ({ children }: { children: React.ReactNode }) => (
  <thead className="[&_tr]:border-b">
    {children}
  </thead>
)

const TableBody = ({ children }: { children: React.ReactNode }) => (
  <tbody className="[&_tr:last-child]:border-0">
    {children}
  </tbody>
)

const TableRow = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <tr className={`border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${className}`}>
    {children}
  </tr>
)

const TableHead = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <th className={`h-12 px-4 text-left align-middle font-medium ${className} [&:has([role=checkbox])]:pr-0`}>
    {children}
  </th>
)

const TableCell = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <td className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className}`}>
    {children}
  </td>
)

// Simple BackendStatus component
const BackendStatus = () => (
  <div className="mb-6">
    <Alert className="bg-gray-700 border-gray-600">
      <AlertDescription className="text-gray-300">
        Backend server status will be checked automatically on login.
      </AlertDescription>
    </Alert>
  </div>
)

// Pagination component
const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: { 
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void 
}) => (
  <div className="flex items-center justify-between px-2 py-3">
    <div className="text-sm text-gray-400">
      Page {currentPage} of {totalPages}
    </div>
    <div className="flex items-center space-x-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="text-gray-300 hover:bg-gray-700"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="text-gray-300 hover:bg-gray-700"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  </div>
)

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [datasets, setDatasets] = useState<{ malicious_urls: URLData[]; valid_urls: URLData[] } | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(false)
  const [newUrl, setNewUrl] = useState("")
  const [selectedTable, setSelectedTable] = useState("malicious_urls")
  const [maliciousSearch, setMaliciousSearch] = useState("")
  const [validSearch, setValidSearch] = useState("")
  
  // Pagination states
  const [maliciousPage, setMaliciousPage] = useState(1)
  const [validPage, setValidPage] = useState(1)
  const itemsPerPage = 50

  useEffect(() => {
    // Clear any existing token on component mount to force fresh login
    const savedToken = null // Always start with no token
    if (savedToken) {
      setToken(savedToken)
      loadAdminData(savedToken)
    }
  }, [])

  const login = async () => {
    setLoading(true)
    try {
      // Check if backend is available first
      const healthCheck = await fetch("http://localhost:8000/", {
        method: "GET",
      }).catch(() => null)

      if (!healthCheck) {
        alert("Backend server is not running. Please start the backend server first.\n\nRun: python backend/main.py")
        setLoading(false)
        return
      }

      const response = await fetch("http://localhost:8000/admin-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      if (response.ok) {
        const data = await response.json()
        setToken(data.access_token)
        // Store token for session persistence
        sessionStorage.setItem("admin_token", data.access_token)
        loadAdminData(data.access_token)
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Invalid credentials" }))
        alert(errorData.detail || "Invalid credentials")
      }
    } catch (error) {
      console.error("Login error:", error)
      alert(
        "Cannot connect to backend server. Please ensure:\n\n1. Backend server is running (python backend/main.py)\n2. Server is accessible at http://localhost:8000\n3. CORS is properly configured",
      )
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setToken(null)
    sessionStorage.removeItem("admin_token")
    setStats(null)
    setDatasets(null)
    setReports([])
    setUsername("")
    setPassword("")
    setMaliciousSearch("")
    setValidSearch("")
    setMaliciousPage(1)
    setValidPage(1)
  }

  const loadAdminData = async (authToken: string) => {
    try {
      // Load stats with error handling
      try {
        const statsResponse = await fetch("http://localhost:8000/admin/stats", {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        })
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats(statsData)
        } else {
          console.warn("Failed to load stats")
        }
      } catch (error) {
        console.warn("Stats endpoint unavailable:", error)
      }

      // Load datasets with error handling
      try {
        const datasetsResponse = await fetch("http://localhost:8000/admin/datasets", {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        })
        if (datasetsResponse.ok) {
          const datasetsData = await datasetsResponse.json()
          setDatasets(datasetsData)
        } else {
          console.warn("Failed to load datasets")
        }
      } catch (error) {
        console.warn("Datasets endpoint unavailable:", error)
      }

      // Load reports with error handling
      try {
        const reportsResponse = await fetch("http://localhost:8000/admin/reports", {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        })
        if (reportsResponse.ok) {
          const reportsData = await reportsResponse.json()
          setReports(reportsData.reports)
        } else {
          console.warn("Failed to load reports")
        }
      } catch (error) {
        console.warn("Reports endpoint unavailable:", error)
      }
    } catch (error) {
      console.error("Error loading admin data:", error)
      alert("Error loading admin data. Please check if the backend server is running.")
    }
  }

  const addUrl = async () => {
    if (!newUrl || !token) return

    try {
      const response = await fetch("http://localhost:8000/admin/manage-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          url: newUrl,
          action: "add",
          table: selectedTable,
        }),
      })

      if (response.ok) {
        setNewUrl("")
        loadAdminData(token)
        alert("URL added successfully")
      }
    } catch (error) {
      console.error("Error adding URL:", error)
    }
  }

  const removeUrl = async (url: string, table: string) => {
    if (!token) return

    try {
      const response = await fetch("http://localhost:8000/admin/manage-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          url: url,
          action: "remove",
          table: table,
        }),
      })

      if (response.ok) {
        loadAdminData(token)
        alert("URL removed successfully")
      }
    } catch (error) {
      console.error("Error removing URL:", error)
    }
  }

  const handleReport = async (reportId: number, action: string) => {
    if (!token) return

    try {
      const response = await fetch(`http://localhost:8000/admin/handle-report/${reportId}?action=${action}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        loadAdminData(token)
        alert(`Report ${action}ed successfully`)
      }
    } catch (error) {
      console.error("Error handling report:", error)
    }
  }

  const retrainModel = async () => {
    if (!token) return

    setLoading(true)
    try {
      const response = await fetch("http://localhost:8000/admin/retrain-model", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Model retrained successfully! New accuracy: ${(data.accuracy * 100).toFixed(2)}%`)
      }
    } catch (error) {
      console.error("Error retraining model:", error)
      alert("Error retraining model")
    } finally {
      setLoading(false)
    }
  }

  // Filter functions for search
  const filteredMaliciousUrls = datasets?.malicious_urls.filter(url =>
    url.url.toLowerCase().includes(maliciousSearch.toLowerCase()) ||
    url.source.toLowerCase().includes(maliciousSearch.toLowerCase())
  ) || []

  const filteredValidUrls = datasets?.valid_urls.filter(url =>
    url.url.toLowerCase().includes(validSearch.toLowerCase()) ||
    url.source.toLowerCase().includes(validSearch.toLowerCase())
  ) || []

  // Pagination calculations
  const totalMaliciousPages = Math.ceil(filteredMaliciousUrls.length / itemsPerPage)
  const totalValidPages = Math.ceil(filteredValidUrls.length / itemsPerPage)
  
  const paginatedMaliciousUrls = filteredMaliciousUrls.slice(
    (maliciousPage - 1) * itemsPerPage,
    maliciousPage * itemsPerPage
  )
  
  const paginatedValidUrls = filteredValidUrls.slice(
    (validPage - 1) * itemsPerPage,
    validPage * itemsPerPage
  )

  // Reset page when search changes
  useEffect(() => {
    setMaliciousPage(1)
  }, [maliciousSearch])

  useEffect(() => {
    setValidPage(1)
  }, [validSearch])

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => window.location.href = 'http://localhost:3000/'}
                className="text-gray-300 hover:text-white hover:bg-gray-700 p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
            <CardTitle className="flex items-center text-white">
              <Shield className="h-5 w-5 mr-2 text-blue-400" />
              Admin Login
            </CardTitle>
            <CardDescription className="text-gray-300">Enter your credentials to access the admin dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input 
              placeholder="Username" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && login()}
              className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
            />
            <Button onClick={login} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
              {loading ? "Logging in..." : "Login"}
            </Button>
            
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={() => window.location.href = 'http://localhost:3000/'} className="mr-4 text-gray-300 hover:text-white hover:bg-gray-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <Shield className="h-8 w-8 text-blue-400 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-gray-400">Safeguard URL Detection System</p>
            </div>
          </div>
          <Button variant="outline" onClick={logout} className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white">
            Logout
          </Button>
        </div>

        {/* Backend Status Check */}
        <BackendStatus />

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Malicious URLs</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-400">{stats.malicious_count}</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Valid URLs</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">{stats.valid_count}</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Pending Reports</CardTitle>
                <Users className="h-4 w-4 text-orange-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-400">{stats.pending_reports}</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Blocked Today</CardTitle>
                <BarChart3 className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-400">{stats.blocked_today}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="datasets" className="space-y-6">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="datasets" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-300">URL Datasets</TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-300">User Reports</TabsTrigger>
            <TabsTrigger value="model" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-300">Model Management</TabsTrigger>
          </TabsList>

          <TabsContent value="datasets" className="space-y-6">
            {/* Add URL Section */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Plus className="h-5 w-5 mr-2 text-green-400" />
                  Add New URL
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="https://example.com"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="flex-1 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                  />
                  <Select value={selectedTable} onValueChange={setSelectedTable}>
                    <SelectTrigger className="w-48 bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="malicious_urls" className="text-gray-300 focus:bg-gray-600 focus:text-white">Malicious URLs</SelectItem>
                      <SelectItem value="valid_urls" className="text-gray-300 focus:bg-gray-600 focus:text-white">Valid URLs</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={addUrl} disabled={!newUrl} className="bg-blue-600 hover:bg-blue-700">
                    Add URL
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* URL Tables */}
            {datasets && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Malicious URLs */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center text-red-400 mb-4">
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      Malicious URLs ({filteredMaliciousUrls.length} total)
                    </CardTitle>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search malicious URLs..."
                        value={maliciousSearch}
                        onChange={(e) => setMaliciousSearch(e.target.value)}
                        className="pl-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-gray-700">
                            <TableHead className="text-gray-300">URL</TableHead>
                            <TableHead className="text-gray-300">Source</TableHead>
                            <TableHead className="text-gray-300">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedMaliciousUrls.map((url) => (
                            <TableRow key={url.id} className="border-gray-700">
                              <TableCell className="font-mono text-xs max-w-xs truncate text-gray-300" title={url.url}>{url.url}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="border-gray-600 text-gray-300">{url.source}</Badge>
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm" onClick={() => removeUrl(url.url, "malicious_urls")} className="hover:bg-gray-700 text-gray-300">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {totalMaliciousPages > 1 && (
                      <Pagination
                        currentPage={maliciousPage}
                        totalPages={totalMaliciousPages}
                        onPageChange={setMaliciousPage}
                      />
                    )}
                  </CardContent>
                </Card>

                {/* Valid URLs */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center text-green-400 mb-4">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Valid URLs ({filteredValidUrls.length} total)
                    </CardTitle>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search valid URLs..."
                        value={validSearch}
                        onChange={(e) => setValidSearch(e.target.value)}
                        className="pl-10 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-gray-700">
                            <TableHead className="text-gray-300">URL</TableHead>
                            <TableHead className="text-gray-300">Source</TableHead>
                            <TableHead className="text-gray-300">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedValidUrls.map((url) => (
                            <TableRow key={url.id} className="border-gray-700">
                              <TableCell className="font-mono text-xs max-w-xs truncate text-gray-300" title={url.url}>{url.url}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="border-gray-600 text-gray-300">{url.source}</Badge>
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm" onClick={() => removeUrl(url.url, "valid_urls")} className="hover:bg-gray-700 text-gray-300">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {totalValidPages > 1 && (
                      <Pagination
                        currentPage={validPage}
                        totalPages={totalValidPages}
                        onPageChange={setValidPage}
                      />
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <Users className="h-5 w-5 mr-2 text-orange-400" />
                  Pending User Reports
                </CardTitle>
                <CardDescription className="text-gray-400">Review and approve/reject user-submitted reports</CardDescription>
              </CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No pending reports</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700">
                        <TableHead className="text-gray-300">URL</TableHead>
                        <TableHead className="text-gray-300">Report Type</TableHead>
                        <TableHead className="text-gray-300">Date</TableHead>
                        <TableHead className="text-gray-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.map((report) => (
                        <TableRow key={report.id} className="border-gray-700">
                          <TableCell className="font-mono text-xs max-w-xs truncate text-gray-300" title={report.url}>{report.url}</TableCell>
                          <TableCell>
                            <Badge variant={report.report_type === "false_positive" ? "destructive" : "default"} className="bg-gray-700 text-gray-300">
                              {report.report_type === "false_positive" ? "False Positive" : "False Negative"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-300">{new Date(report.date_reported).toLocaleDateString()}</TableCell>
                          <TableCell className="space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleReport(report.id, "approve")}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleReport(report.id, "reject")} className="border-gray-600 text-gray-300 hover:bg-gray-700">
                              Reject
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="model" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <RefreshCw className="h-5 w-5 mr-2 text-blue-400" />
                  Model Management
                </CardTitle>
                <CardDescription className="text-gray-400">Retrain the machine learning model with updated datasets</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-gray-700 border-gray-600">
                  <AlertDescription className="text-gray-300">
                    Retraining the model will use all current URLs in the database to create a new model. This process
                    may take a few minutes.
                  </AlertDescription>
                </Alert>
                <Button onClick={retrainModel} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
                  {loading ? "Retraining Model..." : "Retrain Model"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
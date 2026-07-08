import { useState, useEffect } from "react"
import { Mail, Calendar, Printer } from "lucide-react"
import { Button, Card } from "@/components/ui"
import { api } from "@/lib/api"

interface SuperAdminPageProps {
  onLogout: () => void
  onImpersonate: (adminId: string) => void
}

export function SuperAdminPage({ onLogout, onImpersonate }: SuperAdminPageProps) {
  const [admins, setAdmins] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<"admins" | "requests">("admins")
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const adminsRes = await api.get("/auth/admins")
      setAdmins(adminsRes.data)

      const requestsRes = await api.get("/auth/registration-requests")
      setRequests(requestsRes.data)
    } catch (e) {
      console.error("Failed to fetch superadmin data:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleToggleAuthorities = async (adminId: string, currentVal: boolean) => {
    try {
      await api.patch(`/auth/admins/${adminId}`, {
        authoritiesEnabled: !currentVal,
      })
      fetchData()
    } catch (e) {
      console.error("Failed to toggle admin status:", e)
    }
  }

  const handleAction = async (requestId: string, action: "approve" | "reject") => {
    try {
      await api.post(`/auth/registration-requests/${requestId}/action`, { action })
      setSelectedRequest(null)
      fetchData()
    } catch (e) {
      console.error(`Failed to ${action} request:`, e)
    }
  }

  const handlePrint = (req: any) => {
    if (!req) return
    const formattedDate = new Date(req.createdAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    const formattedTime = new Date(req.createdAt).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Access Request Details</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                color: #0f172a;
                margin: 0;
                padding: 40px;
                background-color: #ffffff;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                border: 1px solid #e2e8f0;
                border-radius: 16px;
                padding: 30px;
                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
              }
              .header {
                border-bottom: 2px solid #f1f5f9;
                padding-bottom: 20px;
                margin-bottom: 24px;
              }
              .logo {
                font-size: 20px;
                font-weight: 800;
                color: #6366f1;
                letter-spacing: -0.5px;
              }
              .title {
                font-size: 24px;
                font-weight: 900;
                color: #0f172a;
                margin-top: 8px;
                margin-bottom: 0;
              }
              .badge {
                display: inline-block;
                background-color: #fef3c7;
                color: #d97706;
                font-size: 12px;
                font-weight: 700;
                padding: 4px 10px;
                border-radius: 9999px;
                margin-top: 8px;
              }
              .grid {
                display: grid;
                grid-template-columns: 150px 1fr;
                gap: 16px 8px;
                margin-bottom: 30px;
              }
              .label {
                font-size: 13px;
                font-weight: 700;
                color: #64748b;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .value {
                font-size: 15px;
                font-weight: 500;
                color: #0f172a;
              }
              .footer {
                border-top: 1px solid #f1f5f9;
                padding-top: 16px;
                font-size: 11px;
                color: #94a3b8;
                text-align: center;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">RESTAURANT HUB</div>
                <h1 class="title">Registration Access Request</h1>
                <div class="badge">PENDING APPROVAL</div>
              </div>
              
              <div class="grid">
                <div class="label">Restaurant:</div>
                <div class="value">${req.restaurantName}</div>
                
                <div class="label">Admin Name:</div>
                <div class="value">${req.name}</div>
                
                <div class="label">Email:</div>
                <div class="value">${req.email}</div>
                
                <div class="label">Phone:</div>
                <div class="value">${req.phone}</div>
                
                <div class="label">Request Date:</div>
                <div class="value">${formattedDate}</div>
                
                <div class="label">Request Time:</div>
                <div class="value">${formattedTime}</div>
              </div>
              
              <div class="footer">
                Generated automatically by Restaurant Hub Admin Panel. Confidential document.
              </div>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      setTimeout(() => {
        printWindow.print()
      }, 250)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 border-b border-white/5">
        <div>
          <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-indigo-400">SUPER ADMIN</span>
          <h1 className="text-[1.875rem] font-black tracking-tight text-white leading-tight">Restaurant Hub</h1>
        </div>
        <Button
          onClick={onLogout}
          className="h-10 rounded-xl px-5 border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 font-bold transition-all"
        >
          Logout
        </Button>
      </header>

      {/* Main Panel Wrapper */}
      <main className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Stats tabs bar */}
        <div className="flex bg-[#1e1b4b] p-2 rounded-2xl gap-2 w-full shadow-lg border border-white/5">
          <button
            onClick={() => setActiveTab("admins")}
            className={`flex-1 flex flex-col items-center py-4 rounded-xl transition-all duration-150 ${
              activeTab === "admins" ? "bg-[#4338ca] text-white shadow-md" : "text-indigo-300 hover:bg-white/5"
            }`}
          >
            <span className="text-3xl font-black">{admins.length}</span>
            <span className="text-[0.6875rem] font-bold uppercase tracking-wider mt-1">Active Admins</span>
          </button>

          <button
            onClick={() => setActiveTab("requests")}
            className={`flex-1 flex flex-col items-center py-4 rounded-xl transition-all duration-150 ${
              activeTab === "requests" ? "bg-[#4338ca] text-white shadow-md" : "text-indigo-300 hover:bg-white/5"
            }`}
          >
            <span className="text-3xl font-black">{requests.length}</span>
            <span className="text-[0.6875rem] font-bold uppercase tracking-wider mt-1">Pending Requests</span>
          </button>
        </div>

        {/* Content Section */}
        <div className="bg-[#f5f3ff] rounded-3xl p-8 min-h-[500px] text-slate-800 shadow-xl border border-indigo-100">
          <h2 className="text-[1.25rem] font-black text-indigo-950 mb-6">
            {activeTab === "admins" ? "Registered Restaurants" : "Pending Registration Requests"}
          </h2>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-indigo-950 font-bold text-sm">Loading database...</p>
            </div>
          ) : activeTab === "admins" ? (
            admins.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="text-5xl mb-4">🏪</span>
                <h3 className="text-indigo-950 font-black text-lg">No Admins Yet</h3>
                <p className="text-slate-500 text-sm max-w-sm mt-1">Active registered restaurant owners will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {admins.map((admin) => (
                  <Card key={admin._id} className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[220px]">
                    <div className="space-y-4">
                      {/* Top Info */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-2xl">
                            🏪
                          </div>
                          <div>
                            <h3 className="font-extrabold text-indigo-950 text-base leading-snug">{admin.restaurantName}</h3>
                            <p className="text-slate-400 text-xs mt-0.5 font-semibold">Manager: {admin.name}</p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 text-[0.625rem] font-extrabold bg-green-50 text-green-600 border border-green-200 rounded-lg uppercase tracking-wider">
                          Active
                        </span>
                      </div>

                      {/* Detail list */}
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <div className="flex items-center gap-2 text-slate-600 text-xs">
                          <Mail size={14} className="text-indigo-500" />
                          <span className="font-medium">{admin.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600 text-xs">
                          <Calendar size={14} className="text-indigo-500" />
                          <span className="font-medium">
                            Joined {new Date(admin.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                      </div>

                      {/* Authorities Control */}
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-700">Authorities Status</p>
                          <p className="text-[0.6875rem] font-semibold text-slate-400 mt-0.5">
                            {admin.authoritiesEnabled ? "Enabled (Full Access)" : "Disabled (No Access)"}
                          </p>
                        </div>
                        <button
                          onClick={() => handleToggleAuthorities(admin._id, admin.authoritiesEnabled)}
                          className={`w-11 h-6 rounded-full p-0.5 transition-colors ${
                            admin.authoritiesEnabled ? "bg-green-500" : "bg-slate-300"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full bg-white transition-transform ${
                              admin.authoritiesEnabled ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <Button
                      onClick={() => onImpersonate(admin._id)}
                      className="w-full h-11 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-bold mt-4 shadow-sm"
                    >
                      View Portal →
                    </Button>
                  </Card>
                ))}
              </div>
            )
          ) : (
            requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="text-5xl mb-4">📥</span>
                <h3 className="text-indigo-950 font-black text-lg">No requests yet</h3>
                <p className="text-slate-500 text-sm max-w-sm mt-1">Pending restaurant registration requests will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {requests.map((req) => (
                  <Card key={req._id} className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[180px]">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-2xl">
                            🔑
                          </div>
                          <div>
                            <h3 className="font-extrabold text-indigo-950 text-base leading-snug">{req.restaurantName}</h3>
                            <p className="text-slate-400 text-xs mt-0.5 font-semibold">Manager: {req.name}</p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 text-[0.625rem] font-extrabold bg-amber-50 text-amber-600 border border-amber-200 rounded-lg uppercase tracking-wider">
                          Pending
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <div className="flex items-center gap-2 text-slate-600 text-xs">
                          <Mail size={14} className="text-amber-500" />
                          <span className="font-medium">{req.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600 text-xs">
                          <Calendar size={14} className="text-amber-500" />
                          <span className="font-medium">
                            Requested {new Date(req.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => setSelectedRequest(req)}
                      className="w-full h-11 bg-slate-100 hover:bg-slate-200 text-indigo-600 rounded-xl font-bold mt-4 shadow-sm border border-slate-200"
                    >
                      Inspect Details & Decide →
                    </Button>
                  </Card>
                ))}
              </div>
            )
          )}
        </div>
      </main>

      {/* Modal Inspector */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 text-slate-800 shadow-2xl relative border border-slate-100">
            <button
              onClick={() => setSelectedRequest(null)}
              className="absolute right-6 top-6 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold transition-all"
            >
              ×
            </button>

            <div>
              <span className="text-[0.625rem] font-extrabold bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg px-2 py-0.5 uppercase tracking-wider">
                Pending Registration
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-2">{selectedRequest.restaurantName}</h3>
            </div>

            <div className="mt-6 space-y-4 border-y border-slate-100 py-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[0.6875rem]">Admin Name</span>
                <span className="font-semibold text-slate-800">{selectedRequest.name}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[0.6875rem]">Email Address</span>
                <span className="font-semibold text-slate-800">{selectedRequest.email}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[0.6875rem]">Phone Number</span>
                <span className="font-semibold text-slate-800">{selectedRequest.phone}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[0.6875rem]">Date Requested</span>
                <span className="font-semibold text-slate-800">
                  {new Date(selectedRequest.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[0.6875rem]">Time Requested</span>
                <span className="font-semibold text-slate-800">
                  {new Date(selectedRequest.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <Button
                onClick={() => handlePrint(selectedRequest)}
                className="w-full h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-200"
              >
                <Printer size={16} className="mr-2 inline" /> Print Request
              </Button>
              <div className="flex gap-3">
                <Button
                  onClick={() => handleAction(selectedRequest._id, "reject")}
                  className="flex-1 h-11 border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-xl"
                >
                  Reject
                </Button>
                <Button
                  onClick={() => handleAction(selectedRequest._id, "approve")}
                  className="flex-[2] h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
                >
                  Approve & Create
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

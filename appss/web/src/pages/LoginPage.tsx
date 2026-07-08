import { useState } from "react"
import { Button, Card, Input } from "@/components/ui"
import { Eye, EyeOff, Lock, Mail } from "lucide-react"
import { api } from "@/lib/api"

interface LoginPageProps {
  onLoginSuccess: (token: string, role: string) => void
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const role = "admin"
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!email || !password) {
      setError("Please fill in all fields.")
      return
    }
    setLoading(true)
    try {
      const { data } = await api.post("/auth/login", {
        email: email.trim(),
        password: password,
        role: role,
      })
      if (data.success && data.token) {
        onLoginSuccess(data.token, data.user.role)
      } else {
        setError("Invalid email or password.")
      }
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.error || "Invalid email or password.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] p-4">
      <Card className="w-full max-w-[25rem] border border-border/20 bg-card/90 p-8 shadow-warm-lg backdrop-blur-md">
        <h1 className="text-center text-[1.875rem] font-black tracking-tight text-text">Admin Login</h1>
        
        {error && (
          <div className="mt-4 rounded-xl bg-danger/10 p-3 text-center text-[0.8125rem] font-bold text-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">

          <div className="flex flex-col gap-1.5">
            <label className="text-[0.6875rem] font-bold uppercase tracking-wider text-text-sec">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec/60 pointer-events-none" />
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@restaurant.com"
                className="pl-9 w-full"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[0.6875rem] font-bold uppercase tracking-wider text-text-sec">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec/60 pointer-events-none" />
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-9 pr-9 w-full"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-sec/60 hover:text-text"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <Button type="submit" loading={loading} className="w-full h-11 text-[0.875rem] font-bold mt-2">
            Log In
          </Button>
        </form>
      </Card>
    </div>
  )
}

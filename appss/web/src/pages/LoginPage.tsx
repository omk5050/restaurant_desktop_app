import { useState } from "react"
import { Button, Card, Input } from "@/components/ui"
import { Eye, EyeOff, Lock, Mail, User, Phone, Building2 } from "lucide-react"
import { api } from "@/lib/api"

interface LoginPageProps {
  onLoginSuccess: (token: string, role: string, adminId: string) => void
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const role = "admin"
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Sign up state
  const [name, setName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [phone, setPhone] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
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
        onLoginSuccess(data.token, data.user.role, data.user._id)
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

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    if (!name || !companyName || !email || !phone || !password || !confirmPassword) {
      setError("All fields are mandatory.")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }
    setLoading(true)
    try {
      const { data } = await api.post("/auth/signup", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        restaurantName: companyName.trim(),
      })
      if (data.success) {
        setSuccess("Registration request submitted successfully. The dispatcher will contact you soon.")
        // Reset signup inputs
        setName("")
        setCompanyName("")
        setEmail("")
        setPhone("")
        setPassword("")
        setConfirmPassword("")
        setIsSignUp(false)
      } else {
        setError(data.error || "Signup failed.")
      }
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.error || "Signup failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] p-4">
      <Card className="w-full max-w-[25rem] border border-border/20 bg-card/90 p-8 shadow-warm-lg backdrop-blur-md">
        <h1 className="text-center text-[1.875rem] font-black tracking-tight text-text mb-2">
          {isSignUp ? "Sign Up" : "Admin Login"}
        </h1>
        
        {error && (
          <div className="mt-4 rounded-xl bg-danger/10 p-3 text-center text-[0.8125rem] font-bold text-danger">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 rounded-xl bg-green/10 p-3 text-center text-[0.8125rem] font-bold text-green-600">
            {success}
          </div>
        )}

        {isSignUp ? (
          <form onSubmit={handleSignUpSubmit} className="mt-6 space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.6875rem] font-bold uppercase tracking-wider text-text-sec">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec/60 pointer-events-none" />
                <Input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Full Name"
                  className="pl-9 w-full"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.6875rem] font-bold uppercase tracking-wider text-text-sec">Company Name</label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec/60 pointer-events-none" />
                <Input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="Company Name"
                  className="pl-9 w-full"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.6875rem] font-bold uppercase tracking-wider text-text-sec">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec/60 pointer-events-none" />
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email Address"
                  className="pl-9 w-full"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.6875rem] font-bold uppercase tracking-wider text-text-sec">Phone Number</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec/60 pointer-events-none" />
                <Input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Phone Number"
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
                  placeholder="Password"
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

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.6875rem] font-bold uppercase tracking-wider text-text-sec">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sec/60 pointer-events-none" />
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password"
                  className="pl-9 pr-9 w-full"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-sec/60 hover:text-text"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full h-11 text-[0.875rem] font-bold mt-4 bg-[#ff7043] text-white hover:bg-[#ff7043]/90 shadow-md"
            >
              Create Account & Request Access
            </Button>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false)
                  setError("")
                }}
                className="text-[0.875rem] font-bold text-[#ff7043] hover:underline"
              >
                Log In
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
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

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true)
                  setError("")
                }}
                className="text-[0.875rem] font-bold text-[#ff7043] hover:underline"
              >
                Sign Up
              </button>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}

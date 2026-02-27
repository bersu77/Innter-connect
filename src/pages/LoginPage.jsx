import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Eye, EyeOff, Mail, Lock,
  GraduationCap, Building2, Award, ShieldCheck,
  Github, CheckCircle,
} from 'lucide-react'

const roles = [
  { id: 'student', label: 'Student', icon: GraduationCap },
  { id: 'company', label: 'Company', icon: Building2 },
  { id: 'university', label: 'University', icon: Award },
  { id: 'admin', label: 'Admin', icon: ShieldCheck },
]

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState('student')
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    alert('Authentication is not implemented yet. Coming soon!')
  }

  const activeRole = roles.find((r) => r.id === selectedRole)

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel ── */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 flex-col justify-between p-12 relative overflow-hidden">
        {/* Decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-600/30 rounded-full blur-3xl" />
        </div>

        {/* Top: Logo */}
        <div className="relative">
          <Link to="/" className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <span className="text-white font-extrabold">IC</span>
            </div>
            <span className="text-white font-bold text-xl">InternConnect</span>
          </Link>

          <h1 className="text-4xl font-black text-white leading-tight mb-5">
            Your next great
            <br />
            opportunity awaits.
          </h1>
          <p className="text-blue-200 text-lg leading-relaxed">
            Sign in to access your personalized internship dashboard and manage your journey from
            anywhere.
          </p>
        </div>

        {/* Middle: Feature highlights */}
        <div className="relative space-y-4 my-8">
          {[
            { icon: CheckCircle, text: 'Real-time application tracking' },
            { icon: CheckCircle, text: 'Verified internship listings' },
            { icon: CheckCircle, text: 'University & company partnerships' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-blue-100">
              <Icon size={18} className="text-blue-300 flex-shrink-0" />
              <span className="text-sm font-medium">{text}</span>
            </div>
          ))}
        </div>

        {/* Bottom: Stats */}
        <div className="relative grid grid-cols-3 gap-4">
          {[
            { number: '10k+', label: 'Students' },
            { number: '500+', label: 'Companies' },
            { number: '100+', label: 'Universities' },
          ].map(({ number, label }) => (
            <div key={label} className="bg-white/10 backdrop-blur rounded-xl p-4 text-center border border-white/10">
              <div className="text-2xl font-black text-white mb-1">{number}</div>
              <div className="text-blue-300 text-xs font-medium">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel – Login Form ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-white overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 bg-blue-700 rounded-xl flex items-center justify-center shadow-md shadow-blue-200">
              <span className="text-white font-extrabold text-sm">IC</span>
            </div>
            <span className="text-slate-900 font-bold text-lg">InternConnect</span>
          </div>

          <h2 className="text-3xl font-black text-slate-900 mb-1">Welcome back</h2>
          <p className="text-slate-500 mb-8">Sign in to your account to continue.</p>

          {/* Role Selector */}
          <div className="grid grid-cols-4 gap-1.5 mb-8 p-1.5 bg-slate-100 rounded-2xl">
            {roles.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSelectedRole(id)}
                className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl text-xs font-semibold transition-all ${
                  selectedRole === id
                    ? 'bg-blue-700 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon size={17} />
                {label}
              </button>
            ))}
          </div>

          {/* OAuth Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => alert('Google OAuth coming soon!')}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {/* Google icon */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => alert('GitHub OAuth coming soon!')}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Github size={16} />
              Continue with GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-xs text-slate-500 font-medium uppercase tracking-wide">
                or continue with email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-slate-700">Password</label>
                <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">Remember me for 30 days</span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3.5 rounded-xl transition-colors shadow-md shadow-blue-200 flex items-center justify-center gap-2"
            >
              {activeRole && <activeRole.icon size={17} />}
              Sign in as {activeRole?.label}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
              Create one now
            </Link>
          </p>

          <p className="text-center text-xs text-slate-400 mt-4">
            By signing in, you agree to our{' '}
            <a href="#" className="underline hover:text-slate-600">Terms of Service</a> and{' '}
            <a href="#" className="underline hover:text-slate-600">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  )
}

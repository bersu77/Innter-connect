import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  GraduationCap, Building2, Award,
  Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle,
} from 'lucide-react'

const roles = [
  {
    id: 'student',
    label: 'Student',
    icon: GraduationCap,
    desc: 'Find internships, track applications, and launch your career.',
    color: {
      border: 'border-blue-500',
      bg: 'bg-blue-50',
      ring: 'ring-blue-400',
      iconActive: 'bg-blue-700',
      iconInactive: 'bg-slate-100',
    },
  },
  {
    id: 'company',
    label: 'Company',
    icon: Building2,
    desc: 'Post internships and connect with top university talent.',
    color: {
      border: 'border-indigo-500',
      bg: 'bg-indigo-50',
      ring: 'ring-indigo-400',
      iconActive: 'bg-indigo-700',
      iconInactive: 'bg-slate-100',
    },
  },
  {
    id: 'university',
    label: 'University',
    icon: Award,
    desc: 'Manage student placements and generate compliance reports.',
    color: {
      border: 'border-violet-500',
      bg: 'bg-violet-50',
      ring: 'ring-violet-400',
      iconActive: 'bg-violet-700',
      iconInactive: 'bg-slate-100',
    },
  },
]

const industries = [
  'Technology', 'Finance & Banking', 'Healthcare', 'Education',
  'Manufacturing', 'Retail & E-commerce', 'Media & Entertainment',
  'Consulting', 'Government', 'Non-profit', 'Other',
]

const companySizes = [
  { value: '1-10', label: '1 – 10 employees' },
  { value: '11-50', label: '11 – 50 employees' },
  { value: '51-200', label: '51 – 200 employees' },
  { value: '201-1000', label: '201 – 1,000 employees' },
  { value: '1000+', label: '1,000+ employees' },
]

const currentYear = new Date().getFullYear()

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [selectedRole, setSelectedRole] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    // Student-specific
    university: '',
    major: '',
    gpa: '',
    graduationYear: '',
    // Company-specific
    companyName: '',
    industry: '',
    website: '',
    companySize: '',
    // University-specific
    universityName: '',
    country: '',
    accreditationCode: '',
  })

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    alert('Registration is not implemented yet. Authentication coming soon!')
  }

  const activeRoleData = roles.find((r) => r.id === selectedRole)

  const inputClass =
    'w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition'

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl">
        {/* Logo + Progress */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-7">
            <div className="w-9 h-9 bg-blue-700 rounded-xl flex items-center justify-center shadow-md shadow-blue-200">
              <span className="text-white font-extrabold text-sm">IC</span>
            </div>
            <span className="text-slate-900 font-bold text-xl">InternConnect</span>
          </Link>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3 mb-2">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                step >= 1 ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-500'
              }`}
            >
              {step > 1 ? <CheckCircle size={18} /> : '1'}
            </div>
            <div className={`w-20 h-1.5 rounded-full transition-colors ${step >= 2 ? 'bg-blue-700' : 'bg-slate-200'}`} />
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                step >= 2 ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-500'
              }`}
            >
              2
            </div>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            {step === 1 ? 'Step 1 — Choose your role' : `Step 2 — Complete your ${activeRoleData?.label} profile`}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 md:p-10">
          {/* ── Step 1: Role Selection ── */}
          {step === 1 && (
            <>
              <h2 className="text-2xl font-black text-slate-900 mb-1 text-center">
                Join InternConnect
              </h2>
              <p className="text-slate-500 text-center mb-8">
                How will you be using the platform?
              </p>

              <div className="space-y-3 mb-8">
                {roles.map(({ id, label, icon: Icon, desc, color }) => (
                  <button
                    key={id}
                    onClick={() => setSelectedRole(id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                      selectedRole === id
                        ? `${color.border} ${color.bg} ring-2 ${color.ring}`
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                        selectedRole === id ? color.iconActive : color.iconInactive
                      }`}
                    >
                      <Icon size={21} className={selectedRole === id ? 'text-white' : 'text-slate-500'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900">{label}</div>
                      <div className="text-sm text-slate-500 mt-0.5">{desc}</div>
                    </div>
                    {selectedRole === id && (
                      <div className="w-6 h-6 bg-blue-700 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={() => selectedRole && setStep(2)}
                disabled={!selectedRole}
                className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors"
              >
                Continue <ArrowRight size={17} />
              </button>

              <p className="text-center text-sm text-slate-500 mt-6">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                  Sign in
                </Link>
              </p>
            </>
          )}

          {/* ── Step 2: Registration Form ── */}
          {step === 2 && (
            <>
              <div className="flex items-center gap-3 mb-7">
                <button
                  onClick={() => setStep(1)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  aria-label="Go back"
                >
                  <ArrowLeft size={18} className="text-slate-600" />
                </button>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Create your account</h2>
                  <p className="text-slate-500 text-sm">
                    Registering as a{' '}
                    <span className="font-semibold text-slate-700">{activeRoleData?.label}</span>
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Common: Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={set('firstName')}
                      placeholder="John"
                      required
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={set('lastName')}
                      placeholder="Doe"
                      required
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Common: Email */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={set('email')}
                    placeholder="you@example.com"
                    required
                    className={inputClass}
                  />
                </div>

                {/* Common: Password */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={set('password')}
                      placeholder="At least 8 characters"
                      required
                      minLength={8}
                      className={`${inputClass} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">
                    Minimum 8 characters. Use a mix of letters, numbers, and symbols.
                  </p>
                </div>

                {/* ── Student-specific fields ── */}
                {selectedRole === 'student' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        University / Institution
                      </label>
                      <input
                        type="text"
                        value={form.university}
                        onChange={set('university')}
                        placeholder="e.g. Massachusetts Institute of Technology"
                        className={inputClass}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                          Major / Field
                        </label>
                        <input
                          type="text"
                          value={form.major}
                          onChange={set('major')}
                          placeholder="Computer Science"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                          GPA
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="4"
                          step="0.01"
                          value={form.gpa}
                          onChange={set('gpa')}
                          placeholder="3.80"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                          Grad Year
                        </label>
                        <input
                          type="number"
                          min={currentYear}
                          max={currentYear + 8}
                          value={form.graduationYear}
                          onChange={set('graduationYear')}
                          placeholder={String(currentYear + 2)}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* ── Company-specific fields ── */}
                {selectedRole === 'company' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={form.companyName}
                        onChange={set('companyName')}
                        placeholder="Acme Corporation"
                        required
                        className={inputClass}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                          Industry
                        </label>
                        <select
                          value={form.industry}
                          onChange={set('industry')}
                          className={`${inputClass} bg-white`}
                        >
                          <option value="">Select industry…</option>
                          {industries.map((i) => (
                            <option key={i} value={i}>
                              {i}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                          Company Size
                        </label>
                        <select
                          value={form.companySize}
                          onChange={set('companySize')}
                          className={`${inputClass} bg-white`}
                        >
                          <option value="">Select size…</option>
                          {companySizes.map(({ value, label }) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Company Website
                      </label>
                      <input
                        type="url"
                        value={form.website}
                        onChange={set('website')}
                        placeholder="https://www.yourcompany.com"
                        className={inputClass}
                      />
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                      <strong>Note:</strong> Your company profile will be reviewed and verified by our
                      admin team before you can post internships. This typically takes 1–2 business days.
                    </div>
                  </>
                )}

                {/* ── University-specific fields ── */}
                {selectedRole === 'university' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        University / Institution Name
                      </label>
                      <input
                        type="text"
                        value={form.universityName}
                        onChange={set('universityName')}
                        placeholder="e.g. Addis Ababa University"
                        required
                        className={inputClass}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                          Country
                        </label>
                        <input
                          type="text"
                          value={form.country}
                          onChange={set('country')}
                          placeholder="Ethiopia"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                          Accreditation Code
                        </label>
                        <input
                          type="text"
                          value={form.accreditationCode}
                          onChange={set('accreditationCode')}
                          placeholder="ACC-XXXX"
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                      <strong>Note:</strong> Your institution account will need admin approval before
                      you can verify students and access the full dashboard.
                    </div>
                  </>
                )}

                {/* Terms */}
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    required
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">
                    I agree to the{' '}
                    <a href="#" className="text-blue-600 hover:underline font-medium">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-blue-600 hover:underline font-medium">
                      Privacy Policy
                    </a>
                  </span>
                </label>

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3.5 rounded-xl transition-colors shadow-md shadow-blue-200"
                >
                  Create {activeRoleData?.label} Account
                </button>
              </form>

              <p className="text-center text-sm text-slate-500 mt-6">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

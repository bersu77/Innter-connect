import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, FileText, CheckCircle, BarChart2, Bell, Shield,
  GraduationCap, Building2, Award, ArrowRight, Star,
  ChevronRight, Users, TrendingUp, Zap, Globe,
  MapPin, Clock,
} from 'lucide-react'

/* ─────────────────────────────────────── Data ─────────────────────────────────────── */
const features = [
  {
    icon: Search,
    title: 'Smart Internship Discovery',
    desc: 'Advanced search with filters for location, industry, duration, compensation, and work mode (remote/hybrid/onsite). Full-text search across hundreds of verified listings.',
    badge: 'For Students',
    badgeColor: 'bg-blue-100 text-blue-700',
    iconBg: 'bg-blue-50 text-blue-600',
  },
  {
    icon: FileText,
    title: 'Streamlined Applications',
    desc: 'Apply with your profile, CV, and a tailored cover letter. Track every application in real-time from submission to final decision.',
    badge: 'For Students',
    badgeColor: 'bg-blue-100 text-blue-700',
    iconBg: 'bg-indigo-50 text-indigo-600',
  },
  {
    icon: CheckCircle,
    title: 'Academic Verification',
    desc: 'Universities verify student academic standing and eligibility. Companies receive trust badges after admin approval, ensuring only legitimate parties interact.',
    badge: 'For Universities',
    badgeColor: 'bg-violet-100 text-violet-700',
    iconBg: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: BarChart2,
    title: 'Analytics & Reporting',
    desc: 'Comprehensive dashboards with placement trends, application metrics, and exportable reports in PDF, Excel, or CSV formats for compliance and accreditation.',
    badge: 'For Universities',
    badgeColor: 'bg-violet-100 text-violet-700',
    iconBg: 'bg-violet-50 text-violet-600',
  },
  {
    icon: Bell,
    title: 'Real-time Notifications',
    desc: 'Stay informed with multi-channel alerts via in-app, email, and SMS for application updates, interview schedules, deadlines, and offer notifications.',
    badge: 'All Users',
    badgeColor: 'bg-orange-100 text-orange-700',
    iconBg: 'bg-orange-50 text-orange-600',
  },
  {
    icon: Shield,
    title: 'Audit & Compliance',
    desc: 'Immutable audit logs track every action on the platform. Complete oversight for regulatory compliance, institutional reporting, and accreditation requirements.',
    badge: 'For Admins',
    badgeColor: 'bg-rose-100 text-rose-700',
    iconBg: 'bg-rose-50 text-rose-600',
  },
]

const howItWorksData = {
  students: [
    {
      step: '01',
      title: 'Build Your Profile',
      desc: 'Register, complete your academic profile, upload your CV, add skills & certifications, and get verified by your university.',
      icon: GraduationCap,
    },
    {
      step: '02',
      title: 'Discover & Apply',
      desc: 'Search and filter hundreds of internship listings by industry, location, duration, and work mode. Apply with one click.',
      icon: Search,
    },
    {
      step: '03',
      title: 'Get Placed',
      desc: 'Track your applications in real-time, receive interview invitations, accept offers, and launch your career with confidence.',
      icon: Award,
    },
  ],
  companies: [
    {
      step: '01',
      title: 'Register & Get Verified',
      desc: 'Create your company profile, submit for admin verification, and get approved to post internship opportunities on the platform.',
      icon: Building2,
    },
    {
      step: '02',
      title: 'Post Opportunities',
      desc: 'Create detailed internship listings with requirements, compensation details, work mode, and application deadlines.',
      icon: FileText,
    },
    {
      step: '03',
      title: 'Hire Top Talent',
      desc: 'Review applicants, shortlist candidates, schedule interviews, extend offers, and track confirmed placements.',
      icon: Users,
    },
  ],
  universities: [
    {
      step: '01',
      title: 'Register Institution',
      desc: 'Onboard your university with accreditation details. Set up departments, assign supervisors, and manage admin accounts.',
      icon: Award,
    },
    {
      step: '02',
      title: 'Verify & Supervise',
      desc: 'Verify student academic standing, approve internship eligibility, assign supervisors, and monitor active placements.',
      icon: CheckCircle,
    },
    {
      step: '03',
      title: 'Generate Reports',
      desc: 'Access comprehensive placement analytics and export compliance reports for accreditation and institutional review.',
      icon: BarChart2,
    },
  ],
}

const roleData = [
  {
    id: 'for-students',
    title: 'For Students',
    subtitle: 'Launch your career with confidence',
    icon: GraduationCap,
    color: { bg: 'bg-blue-700', shadow: 'shadow-blue-200', border: 'border-blue-100', gradient: 'from-blue-50', hover: 'hover:shadow-blue-100', btn: 'bg-blue-700 hover:bg-blue-800' },
    benefits: [
      'Browse & filter verified internship listings',
      'One-click apply using your InternConnect profile',
      'Real-time application status tracking',
      'University-verified academic badge',
      'Skills & certification showcase',
      'Interview scheduling & smart notifications',
    ],
    cta: 'Start as Student',
  },
  {
    id: 'for-companies',
    title: 'For Companies',
    subtitle: 'Find the talent of tomorrow, today',
    icon: Building2,
    color: { bg: 'bg-indigo-700', shadow: 'shadow-indigo-200', border: 'border-indigo-100', gradient: 'from-indigo-50', hover: 'hover:shadow-indigo-100', btn: 'bg-indigo-700 hover:bg-indigo-800' },
    benefits: [
      'Post verified internship opportunities',
      'Access pre-verified student profiles',
      'Smart applicant filtering & scoring',
      'Integrated interview management tools',
      'Offer tracking & confirmation',
      'Placement analytics & hiring metrics',
    ],
    cta: 'Post Internships',
  },
  {
    id: 'for-universities',
    title: 'For Universities',
    subtitle: "Empower your students' futures",
    icon: Award,
    color: { bg: 'bg-violet-700', shadow: 'shadow-violet-200', border: 'border-violet-100', gradient: 'from-violet-50', hover: 'hover:shadow-violet-100', btn: 'bg-violet-700 hover:bg-violet-800' },
    benefits: [
      'Student academic verification system',
      'Monitor all internship placements',
      'Supervisor assignment & tracking tools',
      'Compliance & audit trail reports',
      'Bulk student management dashboard',
      'Export reports in PDF / Excel / CSV',
    ],
    cta: 'Join as University',
  },
]

const sampleListings = [
  {
    company: 'Google',
    logo: 'G',
    role: 'Software Engineering Intern',
    location: 'Remote',
    duration: '3 months',
    type: 'Paid',
    tags: ['Python', 'ML', 'React'],
    logoColor: 'bg-blue-600',
  },
  {
    company: 'McKinsey & Co.',
    logo: 'M',
    role: 'Business Analyst Intern',
    location: 'New York, USA',
    duration: '6 months',
    type: 'Paid',
    tags: ['Finance', 'Strategy', 'Excel'],
    logoColor: 'bg-slate-700',
  },
  {
    company: 'WHO',
    logo: 'W',
    role: 'Public Health Research Intern',
    location: 'Geneva, CH',
    duration: '4 months',
    type: 'Stipend',
    tags: ['Healthcare', 'Research', 'Data'],
    logoColor: 'bg-emerald-700',
  },
]

/* ─────────────────────────────────────── Component ─────────────────────────────────────── */
export default function LandingPage() {
  const [activeTab, setActiveTab] = useState('students')

  return (
    <div className="min-h-screen bg-white">
      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 pt-32 pb-28 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-blue-600/25 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-40 w-[400px] h-[400px] bg-indigo-600/25 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[400px] bg-blue-800/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-800/60 backdrop-blur text-blue-200 text-sm font-medium px-4 py-2 rounded-full border border-blue-700/50 mb-8">
              <Star size={13} className="fill-blue-300 text-blue-300" />
              Trusted by 100+ Universities Worldwide
              <ChevronRight size={13} />
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.08] mb-6 tracking-tight">
              Connect. Grow.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-200">
                Succeed.
              </span>
            </h1>

            <p className="text-xl text-blue-200/90 max-w-2xl mx-auto mb-10 leading-relaxed">
              InternConnect brings students, universities, and companies together on one trusted
              platform — making internship management effortless and transparent.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
              <Link
                to="/register"
                className="group flex items-center justify-center gap-2 bg-white text-blue-900 font-bold px-8 py-4 rounded-2xl hover:bg-blue-50 transition-all shadow-2xl shadow-blue-950/50"
              >
                <GraduationCap size={20} />
                I'm a Student
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/register"
                className="group flex items-center justify-center gap-2 bg-blue-700/50 hover:bg-blue-700 border border-blue-500/50 text-white font-bold px-8 py-4 rounded-2xl transition-all backdrop-blur"
              >
                <Building2 size={20} />
                Company / University
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-blue-700/30 rounded-2xl overflow-hidden border border-blue-700/30">
              {[
                { number: '10,000+', label: 'Active Students', icon: Users },
                { number: '500+', label: 'Partner Companies', icon: Building2 },
                { number: '100+', label: 'Universities', icon: Award },
                { number: '95%', label: 'Placement Rate', icon: TrendingUp },
              ].map(({ number, label }) => (
                <div key={label} className="bg-blue-900/60 backdrop-blur px-6 py-7 text-center">
                  <div className="text-3xl font-black text-white mb-1">{number}</div>
                  <div className="text-blue-300 text-sm font-medium">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-semibold px-4 py-2 rounded-full mb-4">
              <Zap size={14} />
              Powerful Features
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-5">
              Everything in One Place
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              From first application to final placement, InternConnect handles every step of the
              internship journey.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className="group bg-white rounded-2xl p-8 border border-slate-200 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50 transition-all duration-300"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${f.iconBg}`}>
                    <Icon size={22} />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-3 text-lg">{f.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-5">{f.desc}</p>
                  <span className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full ${f.badgeColor}`}>
                    {f.badge}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-semibold px-4 py-2 rounded-full mb-4">
              <Globe size={14} />
              Designed for Everyone
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-5">
              How InternConnect Works
            </h2>
            <p className="text-lg text-slate-600 max-w-xl mx-auto">
              A simple yet powerful process tailored for each stakeholder.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex justify-center mb-14">
            <div className="inline-flex bg-white border border-slate-200 rounded-2xl p-1.5 gap-1 shadow-sm">
              {[
                { id: 'students', label: 'Students', icon: GraduationCap },
                { id: 'companies', label: 'Companies', icon: Building2 },
                { id: 'universities', label: 'Universities', icon: Award },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === id
                      ? 'bg-blue-700 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {howItWorksData[activeTab].map((step, idx, arr) => {
              const StepIcon = step.icon
              return (
                <div key={step.step} className="relative flex flex-col items-center text-center group">
                  {idx < arr.length - 1 && (
                    <div className="hidden md:block absolute top-10 left-[calc(50%+3rem)] right-[calc(-50%+3rem)] h-px bg-gradient-to-r from-blue-200 to-blue-100 z-0" />
                  )}
                  <div className="relative z-10 w-20 h-20 bg-blue-700 rounded-2xl flex flex-col items-center justify-center mb-6 shadow-lg shadow-blue-200 group-hover:bg-blue-600 transition-colors">
                    <span className="text-xs font-bold text-blue-300 leading-none mb-1">{step.step}</span>
                    <StepIcon size={22} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">{step.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{step.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Role Benefits ── */}
      <section className="py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-5">
              Built for Every Stakeholder
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Tailored dashboards and tools for each role in the internship ecosystem.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {roleData.map((role) => {
              const Icon = role.icon
              return (
                <div
                  id={role.id}
                  key={role.id}
                  className={`relative group rounded-3xl p-8 bg-gradient-to-b ${role.color.gradient} to-white border ${role.color.border} hover:shadow-2xl ${role.color.hover} transition-all duration-300`}
                >
                  <div className={`w-14 h-14 ${role.color.bg} rounded-2xl flex items-center justify-center mb-5 shadow-lg ${role.color.shadow}`}>
                    <Icon size={24} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-1">{role.title}</h3>
                  <p className="text-slate-500 text-sm mb-7">{role.subtitle}</p>

                  <ul className="space-y-3 mb-8">
                    {role.benefits.map((item) => (
                      <li key={item} className="flex items-center gap-3 text-sm text-slate-700">
                        <CheckCircle size={15} className="text-emerald-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <Link
                    to="/register"
                    className={`w-full flex items-center justify-center gap-2 ${role.color.btn} text-white py-3.5 rounded-xl font-semibold transition-colors group/btn`}
                  >
                    {role.cta}
                    <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Sample Listings Teaser ── */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-3">Explore Opportunities</h2>
            <p className="text-slate-600">
              Browse hundreds of verified internship listings across industries and locations.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {sampleListings.map((job) => (
              <div
                key={job.role}
                className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-blue-200 hover:shadow-lg transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 ${job.logoColor} rounded-xl flex items-center justify-center text-white font-black text-lg`}>
                      {job.logo}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{job.company}</div>
                      <div className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                        <CheckCircle size={11} />
                        Verified Partner
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      job.type === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    {job.type}
                  </span>
                </div>

                <h3 className="font-semibold text-slate-900 mb-3">{job.role}</h3>

                <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} />
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {job.duration}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-5">
                  {job.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
                      {tag}
                    </span>
                  ))}
                </div>

                <Link
                  to="/login"
                  className="w-full flex items-center justify-center gap-2 border border-blue-200 text-blue-700 font-medium py-2.5 rounded-xl text-sm hover:bg-blue-50 hover:border-blue-400 transition-colors"
                >
                  Apply Now <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-blue-700 font-semibold hover:text-blue-800 transition-colors group"
            >
              View all internship listings
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-28 bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
            Ready to Transform Your
            <br />
            Internship Journey?
          </h2>
          <p className="text-xl text-blue-200 mb-10 max-w-2xl mx-auto">
            Join thousands of students, companies, and universities already using InternConnect to
            bridge the gap between education and industry.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-blue-900 font-bold px-10 py-4 rounded-2xl hover:bg-blue-50 transition-colors shadow-2xl"
            >
              Create Free Account
            </Link>
            <Link
              to="/login"
              className="border-2 border-blue-500/50 text-white font-bold px-10 py-4 rounded-2xl hover:bg-blue-800/50 transition-colors backdrop-blur"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

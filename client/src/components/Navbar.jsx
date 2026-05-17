import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How it Works', href: '#how-it-works' },
    { label: 'For Students', href: '#for-students' },
    { label: 'For Companies', href: '#for-companies' },
    { label: 'For Universities', href: '#for-universities' },
  ]

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-sm shadow-sm border-b border-stone-200'
          : 'bg-white/90 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center shadow-md shadow-teal-200">
              <span className="text-white font-extrabold text-sm tracking-tight">IC</span>
            </div>
            <span className="text-stone-900 font-bold text-lg">InternConnect</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-stone-600 hover:text-teal-600 text-sm font-medium transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              to="/login"
              className="text-stone-700 hover:text-teal-600 text-sm font-semibold transition-colors px-3 py-2"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-teal-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            className="lg:hidden p-2 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="lg:hidden py-4 border-t border-stone-200 bg-white">
            <div className="flex flex-col gap-1 mb-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-stone-700 hover:text-teal-600 hover:bg-teal-50 text-sm font-medium py-2.5 px-3 rounded-lg transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="flex gap-3 pt-2 border-t border-stone-100">
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="flex-1 text-center border border-stone-300 text-stone-700 text-sm font-semibold py-2.5 rounded-xl hover:bg-stone-50 transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="flex-1 text-center bg-teal-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-teal-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

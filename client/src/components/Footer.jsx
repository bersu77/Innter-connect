import { Link } from 'react-router-dom'
import { Github, Twitter, Linkedin } from 'lucide-react'

export default function Footer() {
  const sections = [
    {
      heading: 'For Students',
      links: ['Browse Internships', 'Track Applications', 'Upload CV', 'Get Verified', 'View Offers'],
    },
    {
      heading: 'For Companies',
      links: ['Post Internships', 'Review Applications', 'Shortlist Candidates', 'Analytics Dashboard', 'Verification'],
    },
    {
      heading: 'For Universities',
      links: ['Verify Students', 'Monitor Placements', 'Assign Supervisors', 'Generate Reports', 'Audit Logs'],
    },
    {
      heading: 'Company',
      links: ['About Us', 'Careers', 'Blog', 'Help Center', 'Privacy Policy', 'Terms of Service'],
    },
  ]

  return (
    <footer className="bg-stone-950 text-stone-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-extrabold text-sm">IC</span>
              </div>
              <span className="text-white font-bold text-lg">InternConnect</span>
            </Link>
            <p className="text-sm text-stone-500 leading-relaxed mb-6 max-w-xs">
              Bridging students, universities, and companies through a transparent,
              technology-driven internship management platform.
            </p>
            <div className="flex gap-3">
              {[
                { Icon: Twitter, label: 'Twitter' },
                { Icon: Linkedin, label: 'LinkedIn' },
                { Icon: Github, label: 'GitHub' },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-9 h-9 bg-stone-800 hover:bg-stone-700 rounded-lg flex items-center justify-center transition-colors"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {sections.map((section) => (
            <div key={section.heading}>
              <h3 className="text-white font-semibold text-sm mb-4">{section.heading}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-stone-500 hover:text-teal-400 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-stone-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-stone-600">
            © {new Date().getFullYear()} InternConnect. All rights reserved.
          </p>
          <div className="flex gap-6">
            {['Privacy', 'Terms', 'Cookie Policy'].map((item) => (
              <a key={item} href="#" className="text-sm text-stone-600 hover:text-teal-400 transition-colors">
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

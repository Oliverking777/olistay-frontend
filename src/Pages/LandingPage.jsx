import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../Context/AuthContext'

// ─── Hero Search ────────────────────────────────────────────────────────────
const HeroSection = () => {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query)}`)
  }

  return (
    <section className="relative w-full h-[560px] overflow-hidden">
      {/* Real hero photo */}
      <img
        src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1740&q=80"
        alt="Modern apartment exterior"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/50 to-slate-900/20" />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center h-full px-10 max-w-2xl">
        
        <h1 className="text-5xl font-extrabold text-white leading-tight mb-4 drop-shadow-md">
          Rent smarter.<br />Decide with confidence.
        </h1>
        <p className="text-slate-200 text-base mb-6 max-w-lg">
          Olistay matches you to homes based on what you can actually afford — not just what's listed — and gives landlords the tools to price, forecast, and manage with data.
        </p>

        <form onSubmit={handleSearch} className="flex items-center bg-white rounded-xl shadow-lg overflow-hidden max-w-xl">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by neighbourhood, city, or budget — e.g. Bonapriso, 150,000 XAF"
            className="flex-1 px-5 py-4 text-sm text-slate-700 placeholder-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            className="px-5 py-4 bg-white hover:bg-slate-50 transition-colors"
            aria-label="Search"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </form>
      </div>
    </section>
  )
}

// ─── Promo Banner ────────────────────────────────────────────────────────────
const PromoBanner = () => (
  <section className="mx-6 my-6 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between px-8 py-6 gap-4">
    <div>
      <h2 className="text-2xl font-bold text-slate-800">
        Beyond listings — <span className="text-blue-600">your housing optimality score</span>
      </h2>
      <p className="text-slate-500 mt-1 text-sm max-w-md">
        Every home on Olistay is scored across six dimensions — financial fit, household needs, lifestyle, safety, goals, and long-term stability.
      </p>
    </div>
<Link
           to="/financial-profile"
           className="inline-flex items-center justify-center px-6 py-2.5 border-2 border-blue-600 text-blue-600 font-semibold text-sm rounded-xl hover:bg-blue-50 transition-colors no-underline shadow-sm"
         >
           Get your profile
         </Link>
  </section>
)

// ─── Personalised Recommendations ───────────────────────────────────────────
const RecommendationsSection = () => {
  const { isAuthenticated, user } = useAuth()

  return (
    <section className="mx-6 my-6 flex flex-col md:flex-row items-center justify-between gap-8 py-6">
      {/* Left copy */}
      <div className="max-w-xs">
        {isAuthenticated ? (
          <>
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
            </h2>
            <p className="text-slate-500 text-sm mb-6">
              Complete your financial profile so Olistay can recommend homes you can genuinely afford.
            </p>
            <Link
              to="/financial-profile"
              className="inline-flex items-center justify-center px-6 py-2.5 border-2 border-blue-600 text-blue-600 font-semibold text-sm rounded-xl hover:bg-blue-50 transition-colors no-underline"
            >
              Complete your profile
            </Link>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Get a financially informed match</h2>
            <p className="text-slate-500 text-sm mb-6">Sign in and complete your financial profile so Olistay can recommend homes you can genuinely afford.</p>
            <Link
              to="/sign-in"
              className="inline-flex items-center justify-center px-6 py-2.5 border-2 border-blue-600 text-blue-600 font-semibold text-sm rounded-xl hover:bg-blue-50 transition-colors no-underline"
            >
              Sign in
            </Link>
          </>
        )}
      </div>

    {/* Right — mock property cards */}
    <div className="relative w-full max-w-md h-56 flex-shrink-0 select-none">
      {/* Back card */}
      <div className="absolute top-4 right-0 w-72 bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden opacity-60 scale-95 origin-bottom-right">
        <div className="h-28 bg-gradient-to-br from-slate-200 to-slate-300" />
        <div className="p-3 space-y-1.5">
          <div className="h-3 w-3/4 bg-gray-200 rounded" />
          <div className="h-3 w-1/2 bg-gray-200 rounded" />
          <div className="h-3 w-2/3 bg-gray-200 rounded" />
        </div>
      </div>
      {/* Front card */}
      <div className="absolute top-0 left-0 w-72 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-10">
        <div className="h-28 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
            <path d="M9 21V12h6v9" />
          </svg>
        </div>
        <div className="p-3">
          <p className="text-base font-bold text-slate-800">120,000 XAF / month</p>
          <p className="text-xs text-slate-500 mt-0.5">2 bed · 1 bath · Bonapriso, Douala</p>
          <div className="mt-2 space-y-1.5">
            <div className="h-2.5 w-3/4 bg-gray-100 rounded" />
            <div className="h-2.5 w-1/2 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
      {/* Recommendation badges */}
      <div className="absolute -top-3 right-4 flex flex-col gap-2 z-20">
        <div className="flex items-center gap-2 bg-white rounded-full shadow-md px-3 py-1.5 border border-gray-100">
          <span className="w-6 h-6 rounded-full bg-teal-600 flex items-center justify-center flex-shrink-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          </span>
          <span className="text-[11px] font-medium text-slate-700 whitespace-nowrap">Strong financial fit</span>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-full shadow-md px-3 py-1.5 border border-gray-100">
          <span className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
          </span>
          <span className="text-[11px] font-medium text-slate-700 whitespace-nowrap">Matches your lifestyle</span>
        </div>
      </div>
    </div>
    </section>
  )
}

// ─── 3-Card Action Section ───────────────────────────────────────────────────
const ActionCards = () => {
  const cards = [
    {
      title: 'Find a home',
      desc: 'Tell us your budget and household needs. Olistay scores every listing against your real financial situation, not just your search filters.',
      cta: 'Start your search',
      to: '/search',
      icon: (
        // Two people talking / agent icon
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="36" fill="#FFF3E8" />
          <circle cx="32" cy="28" r="8" fill="#F97316" />
          <path d="M18 58c0-7.73 6.27-14 14-14h4" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round"/>
          <rect x="40" y="38" width="22" height="16" rx="4" fill="#2563EB" opacity="0.15"/>
          <rect x="40" y="38" width="22" height="16" rx="4" stroke="#2563EB" strokeWidth="2"/>
          <path d="M44 46h14M44 42h8" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M51 54v4" stroke="#2563EB" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      title: 'List your property',
      desc: 'Get predictive rent pricing, occupancy forecasts, and tenant insights — manage your property with data instead of guesswork.',
      cta: 'Become a landlord',
      to: '/become-a-landlord',
      icon: (
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="36" fill="#EEF2FF" />
          <path d="M40 18L58 34v26H22V34L40 18z" fill="#C7D2FE" stroke="#4F46E5" strokeWidth="2"/>
          <rect x="32" y="44" width="16" height="16" rx="2" fill="white" stroke="#4F46E5" strokeWidth="1.5"/>
          <path d="M40 20v-6M40 14l-4 4M40 14l4 4" stroke="#F97316" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="40" cy="40" r="5" fill="#4F46E5"/>
          <path d="M38 40l2 2 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      title: 'Check your financial fit',
      desc: 'Before you commit to rent, see how a home affects your real budget — utilities, transport, and savings included, not just the monthly price.',
      cta: 'Get your profile',
      to: '/financial-profile',
      icon: (
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="36" fill="#F0FDF4" />
          <rect x="20" y="32" width="24" height="26" rx="2" fill="#BBF7D0" stroke="#16A34A" strokeWidth="2"/>
          <path d="M20 38L32 26l12 12" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="38" y="38" width="18" height="20" rx="2" fill="#4ADE80" stroke="#16A34A" strokeWidth="2"/>
          <path d="M38 44L47 36l9 8" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="26" y="46" width="8" height="12" rx="1" fill="white" stroke="#16A34A" strokeWidth="1.5"/>
        </svg>
      ),
    },
  ]

  return (
    <section className="mx-6 my-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {cards.map((card) => (
          <div
            key={card.title}
            className="bg-white border border-gray-200 rounded-2xl flex flex-col items-center text-center p-8 gap-4 hover:shadow-md transition-shadow"
          >
            {card.icon}
            <h3 className="text-lg font-bold text-slate-800">{card.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed flex-1">{card.desc}</p>
            <Link
              to={card.to}
              className="inline-flex items-center justify-center px-6 py-2.5 border-2 border-blue-600 text-blue-600 text-sm font-semibold rounded-xl hover:bg-blue-50 transition-colors no-underline mt-2"
            >
              {card.cta}
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── About Recommendations ───────────────────────────────────────────────────
const AboutRecommendations = () => (
  <section className="mx-6 my-2 py-10 border-t border-gray-100 text-center">
    <h3 className="text-base font-semibold text-slate-700 mb-2">About your Olistay match score</h3>
    <p className="text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed">
      Every recommendation weighs six factors: financial compatibility, household fit, lifestyle, health and safety, your stated goals, and long-term stability.
      The more you tell us, the sharper your matches get — and you're always in control of what you share.
    </p>
  </section>
)

// ─── Footer ──────────────────────────────────────────────────────────────────
const Footer = () => {
  const categories = [
    {
      label: 'For Tenants',
      links: ['Search rentals', 'Financial profile', 'My recommendations', 'Saved favourites'],
    },
    {
      label: 'For Landlords',
      links: ['List a property', 'Predictive pricing', 'Occupancy forecast', 'Tenant insights'],
    },
    {
      label: 'Payments',
      links: ['Orange Money', 'MTN Mobile Money', 'Payment history', 'Rent reminders'],
    },
    {
      label: 'Browse Homes',
      links: ['Yaoundé homes', 'Douala homes', 'Bafoussam homes', 'Limbe homes'],
    },
  ]

  return (
    <footer className="bg-white border-t border-gray-200 mt-6">
      {/* Category columns */}
      <div className="max-w-5xl mx-auto px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
        {categories.map((cat) => (
          <div key={cat.label}>
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1">
              {cat.label}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </h4>
            <ul className="space-y-2">
              {cat.links.map((l) => (
                <li key={l}>
                  <Link to="#" className="text-xs text-slate-500 hover:text-blue-600 no-underline transition-colors">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100" />

      {/* Utility links */}
      <div className="max-w-5xl mx-auto px-8 py-6 flex flex-wrap justify-center gap-x-6 gap-y-2">
        {['About', 'Careers', 'Help', 'Advertise', 'Terms of use', 'Privacy Notice', 'Cookie Preference'].map((l) => (
          <Link key={l} to="#" className="text-xs text-slate-500 hover:text-blue-600 no-underline transition-colors">
            {l}
          </Link>
        ))}
      </div>

      {/* Social + copyright */}
      <div className="border-t border-gray-100" />
      <div className="max-w-5xl mx-auto px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
            <path d="M3 13.5L14 3L25 13.5" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 11V23C6 23.55 6.45 24 7 24H11V18H17V24H21C21.55 24 22 23.55 22 23V11" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-base font-bold text-slate-800">Oli<span className="text-blue-600">stay</span></span>
        </div>

        {/* Social icons */}
        <div className="flex items-center gap-3 text-slate-400">
          <span className="text-xs text-slate-500 mr-1">Follow us:</span>
          {/* Facebook */}
          <a href="#" className="hover:text-blue-600 transition-colors" aria-label="Facebook">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
          </a>
          {/* Instagram */}
          <a href="#" className="hover:text-pink-500 transition-colors" aria-label="Instagram">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
            </svg>
          </a>
          {/* TikTok */}
          <a href="#" className="hover:text-slate-800 transition-colors" aria-label="TikTok">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/></svg>
          </a>
        </div>

        <p className="text-xs text-slate-400">© 2024–2026 Olistay</p>
      </div>
    </footer>
  )
}

// ─── Main Landing Page ────────────────────────────────────────────────────────
const LandingPage = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <HeroSection />
      <PromoBanner />
      <RecommendationsSection />
      <ActionCards />
      <AboutRecommendations />
      <Footer />
    </div>
  )
}

export default LandingPage
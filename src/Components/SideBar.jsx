import React from 'react'
import { Link, useLocation } from 'react-router-dom'

const navItems = [
  {
    label: 'Search',
    path: '/search',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    label: 'Financial Profile',
    path: '/financial-profile',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
        <path d="M7 10h2l2-4 2 8 2-4h2" />
      </svg>
    ),
  },
  {
    label: 'My Recommendations',
    path: '/my-recommendation',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
]

const SideBar = () => {
  const location = useLocation()

  return (
    <aside className="fixed top-16 left-0 z-30 w-20 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 flex flex-col items-center py-6 overflow-y-auto">
      <nav className="flex flex-col items-center gap-1 w-full">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              title={item.label}
              className={`
                flex flex-col items-center justify-center gap-1.5 w-full px-2 py-3.5
                no-underline transition-colors duration-150 cursor-pointer
                ${isActive
                  ? 'text-slate-700 bg-slate-100 border-r-[3px] border-slate-700'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }
              `}
            >
              <span
                className={`
                  flex items-center justify-center w-9 h-9 rounded-full
                  transition-colors duration-150
                  ${isActive
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-100 text-slate-500'
                  }
                `}
              >
                {item.icon}
              </span>
              <span className="text-[10px] font-medium text-center leading-tight tracking-wide max-w-[64px] break-words">
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

export default SideBar
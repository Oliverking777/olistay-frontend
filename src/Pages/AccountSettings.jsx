import React from 'react'
import { Link } from 'react-router-dom'

const ChevronIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M9 6L15 12L9 18"
      stroke="#2563EB"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const ProfileIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="14" cy="14" r="13" fill="#EFF6FF" />
    <circle cx="14" cy="11.5" r="3.5" stroke="#2563EB" strokeWidth="1.6" />
    <path
      d="M7 21.5C7.8 18.3 10.6 16.5 14 16.5C17.4 16.5 20.2 18.3 21 21.5"
      stroke="#2563EB"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
)

const NotificationsIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="14" cy="14" r="13" fill="#EFF6FF" />
    <rect x="7" y="9" width="14" height="10" rx="1.5" stroke="#2563EB" strokeWidth="1.6" />
    <path
      d="M7.5 9.5L14 14.5L20.5 9.5"
      stroke="#2563EB"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const DocumentIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="14" cy="14" r="13" fill="#EFF6FF" />
    <path
      d="M11 8H16L19 11V20C19 20.5523 18.5523 21 18 21H11C10.4477 21 10 20.5523 10 20V9C10 8.44772 10.4477 8 11 8Z"
      stroke="#2563EB"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path d="M16 8V11H19" stroke="#2563EB" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M12.5 15H16.5" stroke="#2563EB" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M12.5 17.5H16.5" stroke="#2563EB" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
)

const settingsItems = [
  {
    to: '/profile',
    icon: ProfileIcon,
    title: 'Profile',
    description: 'Personalize your account and update your sign in preferences.',
  },
]

const AccountSettings = () => {
  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Account settings</h1>

        <div className="flex flex-col gap-4">
          {settingsItems.map(({ to, icon: Icon, title, description }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center justify-between bg-white rounded-lg border border-gray-200 shadow-sm px-6 py-5 no-underline hover:shadow-md transition-shadow duration-150"
            >
              <div className="flex items-start gap-4">
                <Icon />
                <div>
                  <p className="text-base font-semibold text-slate-900 mb-1">{title}</p>
                  <p className="text-sm text-slate-500">{description}</p>
                </div>
              </div>
              <ChevronIcon />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AccountSettings
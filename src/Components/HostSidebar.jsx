import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';

// Simple icon components for clarity and reusability
const HostSideBarIcons = {
  Property: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  ),
  Appointments: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  ),
  
  Logout: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
};

const HostSideBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const firstName = user?.firstName || 'Host';
  const lastName = user?.lastName || '';

  const handleLogout = async () => {
    await logout();
    navigate('/sign-in', { replace: true });
  };

  const menuItems = [
    { name: 'Properties', path: '/properties', Icon: HostSideBarIcons.Property },
    { name: 'Create Property', path: '/properties/new', Icon: HostSideBarIcons.Property },
    { name: 'Appointments', path: '/appointments', Icon: HostSideBarIcons.Appointments },
    // { name: 'Predictions', path: '/predictions', Icon: HostSideBarIcons.Predictions },
  ];

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-100 flex flex-col p-6 select-none shadow-sm">

      {/* 1. Logo Section */}
      <div className="flex items-center gap-2.5 mb-10 pl-1">
        <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-inner">
          <svg width="16" height="16" viewBox="0 0 28 28" fill="none">
            <path d="M3 13.5L14 3L25 13.5" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 11V23C6 23.55 6.45 24 7 24H11V18H17V24H21C21.55 24 22 23.55 22 23V11" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="text-xl font-bold text-slate-800 tracking-tight">Oli<span className="text-blue-600">stay</span> <span className="font-medium text-slate-400 text-lg">Rentals</span></span>
      </div>

      {/* 2. Menu Items Section */}
      <nav className="flex-grow space-y-3">
        {menuItems.map(({ name, path, Icon }) => (
          <NavLink
            key={name}
            to={path}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-150 no-underline whitespace-nowrap group ${
                isActive
                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`
            }
          >
            <Icon />
            {name}
          </NavLink>
        ))}
      </nav>

      {/* 3. User Section + Logout */}
      <div className="border-t border-gray-100 pt-5 mt-auto">
        <div className="flex items-center gap-3 p-2 rounded-xl mb-2">
          <div className="w-10 h-10 rounded-full bg-teal-700 flex items-center justify-center text-white text-lg font-semibold flex-shrink-0 shadow-sm">
            {firstName.charAt(0)}
          </div>
          <span className="text-sm font-medium text-slate-800 truncate">
            {`${firstName} ${lastName}`}
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
        >
          <HostSideBarIcons.Logout />
          Logout
        </button>
      </div>

    </aside>
  );
};

export default HostSideBar;
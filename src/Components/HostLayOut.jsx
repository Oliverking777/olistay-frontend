import React from 'react'
import { Outlet } from 'react-router-dom'
import HostSideBar from './HostSidebar'

const HostLayOut = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <HostSideBar />
      <main className="pl-64 min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}

export default HostLayOut
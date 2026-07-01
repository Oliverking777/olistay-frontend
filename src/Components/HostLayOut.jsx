import React from 'react'
import { Outlet } from 'react-router-dom'
import HostSideBar from './HostSidebar'

const HostLayOut = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <HostSideBar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}

export default HostLayOut
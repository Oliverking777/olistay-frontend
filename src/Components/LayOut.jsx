import React from 'react'
import { Outlet } from 'react-router-dom'
import NavBar from './NavBar'
import SideBar from './SideBar'

const LayOut = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar: fixed across the full width of the viewport */}
      <NavBar />

      {/* Sidebar: fixed below the navbar */}
      <SideBar />

      {/* Page content: offset to clear the fixed navbar (top) and sidebar (left) */}
      <main className="pt-16 pl-20 min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}

export default LayOut
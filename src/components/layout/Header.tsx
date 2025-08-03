import React from 'react'
import { Link } from 'react-router-dom'
import { Bars3Icon, BeakerIcon } from '@heroicons/react/24/outline'

export const Header: React.FC = () => {
  return (
    <header className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="p-2 bg-red-600 rounded-lg">
            <BeakerIcon className="h-6 w-6 text-white" /> {/* Same as Footer Icon */}
          </div>
          <span className="text-xl font-bold">BloodBank+</span>
        </Link>

        {/* Navigation Links (Desktop) */}
        <nav className="hidden md:flex space-x-6">
          <Link to="/search" className="hover:text-red-400 transition-colors">
            Find Blood
          </Link>
          <Link to="/register" className="hover:text-red-400 transition-colors">
            Become a Donor
          </Link>
          <Link to="/about" className="hover:text-red-400 transition-colors">
            About Us
          </Link>
          <Link to="/contact" className="hover:text-red-400 transition-colors">
            Contact
          </Link>
        </nav>

        {/* Mobile Menu Icon */}
        <div className="md:hidden">
          <Bars3Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </header>
  )
}

import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  DropIcon, 
  BellIcon, 
  UserIcon, 
  SunIcon, 
  MoonIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { Button } from '../ui/Button'

export const Header: React.FC = () => {
  const { user, profile, signOut } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="p-2 bg-red-600 rounded-lg"
            >
              <DropIcon className="h-6 w-6 text-white" />
            </motion.div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              BloodBank+
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  to="/search"
                  className="text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  Search Blood
                </Link>
                {(profile?.role === 'blood_bank' || profile?.role === 'admin') && (
                  <Link
                    to="/inventory"
                    className="text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    Inventory
                  </Link>
                )}
                {profile?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    Admin
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link
                  to="/search"
                  className="text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  Find Blood
                </Link>
                <Link
                  to="/about"
                  className="text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  About
                </Link>
              </>
            )}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              {isDark ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>

            {user ? (
              <>
                {/* Notifications */}
                <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors relative">
                  <BellIcon className="h-5 w-5" />
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                </button>

                {/* User Menu */}
                <div className="relative">
                  <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                    <UserIcon className="h-5 w-5" />
                  </button>
                </div>

                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">
                    Register
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              {isMenuOpen ? (
                <XMarkIcon className="h-5 w-5" />
              ) : (
                <Bars3Icon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden py-4 space-y-2"
          >
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/search"
                  className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Search Blood
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </motion.div>
        )}
      </div>
    </header>
  )
}
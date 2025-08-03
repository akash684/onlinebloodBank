import React from 'react'
import { Link } from 'react-router-dom'
import { BeakerIcon, HeartIcon } from '@heroicons/react/24/outline' // Use BeakerIcon instead of WaterDropIcon

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-red-600 rounded-lg">
                <BeakerIcon className="h-6 w-6 text-white" /> {/* Corrected Icon */}
              </div>
              <span className="text-xl font-bold">BloodBank+</span>
            </div>
            <p className="text-gray-400 text-sm">
              Connecting lives through safe and reliable blood donation services.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link to="/search" className="hover:text-white transition-colors">
                  Find Blood
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white transition-colors">
                  Become a Donor
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* For Organizations */}
          <div>
            <h3 className="font-semibold mb-4">For Organizations</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link to="/register" className="hover:text-white transition-colors">
                  Hospital Registration
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white transition-colors">
                  Blood Bank Partnership
                </Link>
              </li>
              <li>
                <Link to="/support" className="hover:text-white transition-colors">
                  Support Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Emergency Contact */}
          <div>
            <h3 className="font-semibold mb-4">Emergency</h3>
            <div className="text-red-400 space-y-2">
              <p className="font-bold text-lg">24/7 Hotline</p>
              <p className="text-xl">1-800-BLOOD</p>
              <p className="text-gray-400 text-sm">
                For urgent blood requirements
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-1 text-gray-400">
              <span>Made with</span>
              <HeartIcon className="h-4 w-4 text-red-500" />
              <span>for humanity</span>
            </div>
            <div className="flex space-x-6 text-gray-400 text-sm mt-4 md:mt-0">
              <Link to="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
              <span>&copy; 2025 BloodBank+</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

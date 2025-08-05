import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  HeartIcon, 
  UserGroupIcon, 
  ClockIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import { MapPinIcon } from '@heroicons/react/24/solid' // Ensure correct icon path if needed
import { WaterDropletIcon } from '../components/icons/WaterDropletIcon'

import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useAuth } from '../contexts/AuthContext'

export const HomePage: React.FC = () => {
  const { user } = useAuth()

  const features = [
    {
      icon: <WaterDropletIcon className="h-8 w-8" />,
      title: 'Real-time Inventory',
      description: 'Track blood availability across multiple blood banks in real-time.'
    },
    {
      icon: <ClockIcon className="h-8 w-8" />,
      title: '24/7 Emergency Support',
      description: 'Round-the-clock support for critical blood requirements.'
    },
    {
      icon: <ShieldCheckIcon className="h-8 w-8" />,
      title: 'Safe & Secure',
      description: 'All blood units are thoroughly tested and stored safely.'
    },
    {
      icon: <UserGroupIcon className="h-8 w-8" />,
      title: 'Community Driven',
      description: 'Connect with a network of verified donors and recipients.'
    }
  ]

  const stats = [
    { label: 'Lives Saved', value: '10,000+', color: 'text-red-600' },
    { label: 'Active Donors', value: '5,000+', color: 'text-blue-600' },
    { label: 'Partner Hospitals', value: '150+', color: 'text-green-600' },
    { label: 'Blood Banks', value: '50+', color: 'text-purple-600' }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-red-600 via-red-700 to-red-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex justify-center mb-8">
                <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
                  <HeartIcon className="h-16 w-16" />
                </div>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Every Drop
                <span className="block text-red-200">Saves a Life</span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-red-100 max-w-3xl mx-auto">
                Connect with blood donors, find available blood units, and help save lives 
                through our modern blood banking platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  <Link to="/dashboard">
                    <Button size="lg" variant="secondary">
                      Go to Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/register">
                      <Button size="lg" variant="secondary">
                        Become a Donor
                      </Button>
                    </Link>
                    <Link to="/search">
                      <Button size="lg" variant="outline">
                        Find Blood Now
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className={`text-3xl md:text-4xl font-bold ${stat.color} mb-2`}>
                  {stat.value}
                </div>
                <div className="text-gray-600 dark:text-gray-400 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose BloodBank+?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Our platform provides a seamless experience for donors, recipients, and healthcare providers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card hover className="p-6 text-center h-full">
                  <div className="text-red-600 dark:text-red-400 mb-4 flex justify-center">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Make a Difference?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of donors and healthcare providers who trust BloodBank+ 
              to connect and save lives every day.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!user && (
                <>
                  <Link to="/register">
                    <Button size="lg">
                      Register Now
                    </Button>
                  </Link>
                  <Link to="/search">
                    <Button size="lg" variant="outline">
                      Search Blood Banks
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

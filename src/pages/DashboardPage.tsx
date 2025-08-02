import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ChartBarIcon,
  DropIcon,
  UsersIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Link } from 'react-router-dom'

interface DashboardStats {
  totalDonations: number
  scheduledDonations: number
  bloodRequests: number
  availableUnits: number
}

interface RecentActivity {
  id: string
  type: 'donation' | 'request' | 'inventory'
  title: string
  description: string
  date: string
  status: string
}

export const DashboardPage: React.FC = () => {
  const { profile } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalDonations: 0,
    scheduledDonations: 0,
    bloodRequests: 0,
    availableUnits: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [profile])

  const fetchDashboardData = async () => {
    if (!profile) return

    try {
      setLoading(true)
      
      // Fetch stats based on user role
      const promises = []

      if (profile.role === 'donor') {
        // Get donor's donation history
        promises.push(
          supabase
            .from('donation_history')
            .select('*')
            .eq('donor_id', profile.id)
        )
      } else if (profile.role === 'recipient') {
        // Get recipient's blood requests
        promises.push(
          supabase
            .from('blood_requests')
            .select('*')
            .eq('requester_id', profile.id)
        )
      } else if (profile.role === 'blood_bank' || profile.role === 'admin') {
        // Get inventory data
        promises.push(
          supabase
            .from('blood_inventory')
            .select('*')
        )
        promises.push(
          supabase
            .from('blood_requests')
            .select('*')
        )
      }

      const results = await Promise.all(promises)
      
      // Process results based on role
      if (profile.role === 'donor') {
        const donations = results[0]?.data || []
        setStats(prev => ({
          ...prev,
          totalDonations: donations.filter(d => d.status === 'completed').length,
          scheduledDonations: donations.filter(d => d.status === 'pending').length
        }))
      } else if (profile.role === 'blood_bank' || profile.role === 'admin') {
        const inventory = results[0]?.data || []
        const requests = results[1]?.data || []
        
        setStats(prev => ({
          ...prev,
          availableUnits: inventory.reduce((sum, item) => sum + item.quantity, 0),
          bloodRequests: requests.filter(r => r.status === 'pending').length
        }))
      }

      // Generate sample recent activity
      setRecentActivity([
        {
          id: '1',
          type: 'donation',
          title: 'Blood Donation Scheduled',
          description: 'Your donation appointment is confirmed for tomorrow',
          date: new Date().toISOString(),
          status: 'scheduled'
        },
        
      ])

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const getRoleSpecificStats = () => {
    const commonClasses = "p-6"
    
    switch (profile?.role) {
      case 'donor':
        return [
          {
            title: 'Total Donations',
            value: stats.totalDonations,
            icon: <DropIcon className="h-8 w-8" />,
            color: 'text-red-600',
            bgColor: 'bg-red-100 dark:bg-red-900/20'
          },
          {
            title: 'Scheduled',
            value: stats.scheduledDonations,
            icon: <CalendarIcon className="h-8 w-8" />,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100 dark:bg-blue-900/20'
          },
          {
            title: 'Lives Saved',
            value: stats.totalDonations * 3, // Estimate: 1 donation saves ~3 lives
            icon: <UsersIcon className="h-8 w-8" />,
            color: 'text-green-600',
            bgColor: 'bg-green-100 dark:bg-green-900/20'
          }
        ]
      
      case 'recipient':
        return [
          {
            title: 'Active Requests',
            value: stats.bloodRequests,
            icon: <ExclamationTriangleIcon className="h-8 w-8" />,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100 dark:bg-orange-900/20'
          }
        ]
      
      default:
        return [
          {
            title: 'Available Units',
            value: stats.availableUnits,
            icon: <DropIcon className="h-8 w-8" />,
            color: 'text-red-600',
            bgColor: 'bg-red-100 dark:bg-red-900/20'
          },
          {
            title: 'Pending Requests',
            value: stats.bloodRequests,
            icon: <ClockIcon className="h-8 w-8" />,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-100 dark:bg-yellow-900/20'
          },
          {
            title: 'Total Inventory',
            value: stats.availableUnits,
            icon: <ChartBarIcon className="h-8 w-8" />,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100 dark:bg-purple-900/20'
          }
        ]
    }
  }

  const getRoleSpecificActions = () => {
    switch (profile?.role) {
      case 'donor':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/donate">
              <Button className="w-full">
                Schedule Donation
              </Button>
            </Link>
            <Link to="/history">
              <Button variant="outline" className="w-full">
                View History
              </Button>
            </Link>
          </div>
        )
      
      case 'recipient':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/request">
              <Button className="w-full">
                Request Blood
              </Button>
            </Link>
            <Link to="/search">
              <Button variant="outline" className="w-full">
                Search Blood Banks
              </Button>
            </Link>
          </div>
        )
      
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/inventory">
              <Button className="w-full">
                Manage Inventory
              </Button>
            </Link>
            <Link to="/requests">
              <Button variant="outline" className="w-full">
                Review Requests
              </Button>
            </Link>
            <Link to="/reports">
              <Button variant="outline" className="w-full">
                View Reports
              </Button>
            </Link>
          </div>
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const statsData = getRoleSpecificStats()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {getGreeting()}, {profile?.name}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {profile?.role === 'donor' && "Thank you for being a life-saver. Here's your donation overview."}
            {profile?.role === 'recipient' && "Manage your blood requests and find available donors."}
            {(profile?.role === 'blood_bank' || profile?.role === 'admin') && "Monitor your blood bank operations and inventory."}
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statsData.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card hover className="p-6">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <div className={stat.color}>
                      {stat.icon}
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-1"
          >
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h3>
              {getRoleSpecificActions()}
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recent Activity
              </h3>
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
                          <DropIcon className="h-4 w-4 text-red-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {new Date(activity.date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="info" size="sm">
                        {activity.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ClockIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No recent activity to show
                  </p>
                </div>
              )}
            </Card>
          </motion.div>
        </div>

        {/* Emergency Notice */}
        {profile?.role === 'recipient' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8"
          >
            <Card className="p-6 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-3" />
                <div>
                  <h4 className="text-lg font-semibold text-red-800 dark:text-red-400">
                    Emergency Blood Needed?
                  </h4>
                  <p className="text-red-700 dark:text-red-300 mt-1">
                    For critical blood requirements, call our 24/7 hotline: <strong>1-800-BLOOD</strong>
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
}
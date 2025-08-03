import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { 
  ChartBarIcon,
  UsersIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  WaterDropIcon,
  BellIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

interface DashboardStats {
  totalDonations: number
  scheduledDonations: number
  bloodRequests: number
  availableUnits: number
  completedDonations: number
  pendingRequests: number
}

interface ScheduledDonation {
  id: string
  donation_date: string
  blood_bank: { name: string }
  status: string
  blood_group: string
}

interface DonationHistory {
  id: string
  donation_date: string
  blood_bank: { name: string }
  blood_group: string
  status: string
}

interface BloodRequest {
  id: string
  blood_group: string
  quantity: number
  status: string
  created_at: string
  patient_name?: string
  urgency?: string
}

interface Notification {
  id: string
  message: string
  type: string
  created_at: string
  is_read: boolean
}

export const DashboardPage: React.FC = () => {
  const { profile } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalDonations: 0,
    scheduledDonations: 0,
    bloodRequests: 0,
    availableUnits: 0,
    completedDonations: 0,
    pendingRequests: 0
  })
  const [scheduledDonations, setScheduledDonations] = useState<ScheduledDonation[]>([])
  const [donationHistory, setDonationHistory] = useState<DonationHistory[]>([])
  const [bloodRequests, setBloodRequests] = useState<BloodRequest[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
    setupRealtimeSubscriptions()
  }, [profile])

  const setupRealtimeSubscriptions = () => {
    if (!profile) return

    // Subscribe to notifications
    const notificationChannel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'bloodbank',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`
        },
        (payload) => {
          const newNotification = payload.new as Notification
          setNotifications(prev => [newNotification, ...prev])
          toast.success(newNotification.message)
        }
      )
      .subscribe()

    // Subscribe to blood requests updates
    if (profile.role === 'blood_bank' || profile.role === 'admin') {
      const requestsChannel = supabase
        .channel('blood_requests')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'bloodbank',
            table: 'blood_requests'
          },
          () => {
            fetchDashboardData()
          }
        )
        .subscribe()
    }

    return () => {
      supabase.removeChannel(notificationChannel)
    }
  }

  const fetchDashboardData = async () => {
    if (!profile) return

    try {
      setLoading(true)
      
      // Fetch based on user role
      if (profile.role === 'donor') {
        await fetchDonorData()
      } else if (profile.role === 'recipient') {
        await fetchRecipientData()
      } else if (profile.role === 'blood_bank' || profile.role === 'admin') {
        await fetchBloodBankData()
      }

      // Fetch notifications for all users
      await fetchNotifications()

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const fetchDonorData = async () => {
    // Fetch donation history
    const { data: donations } = await supabase
      .from('donation_history')
      .select(`
        *,
        blood_bank:blood_bank_id (name)
      `)
      .eq('donor_id', profile?.id)
      .order('donation_date', { ascending: false })

    if (donations) {
      setDonationHistory(donations)
      const scheduled = donations.filter(d => d.status === 'pending')
      const completed = donations.filter(d => d.status === 'completed')
      
      setScheduledDonations(scheduled)
      setStats(prev => ({
        ...prev,
        totalDonations: donations.length,
        scheduledDonations: scheduled.length,
        completedDonations: completed.length
      }))
    }
  }

  const fetchRecipientData = async () => {
    // Fetch blood requests
    const { data: requests } = await supabase
      .from('blood_requests')
      .select('*')
      .eq('requester_id', profile?.id)
      .order('created_at', { ascending: false })

    if (requests) {
      setBloodRequests(requests)
      const pending = requests.filter(r => r.status === 'pending')
      
      setStats(prev => ({
        ...prev,
        bloodRequests: requests.length,
        pendingRequests: pending.length
      }))
    }
  }

  const fetchBloodBankData = async () => {
    // Fetch inventory
    const { data: inventory } = await supabase
      .from('blood_inventory')
      .select('*')
      .eq('blood_bank_id', profile?.id)

    // Fetch requests assigned to this blood bank
    const { data: requests } = await supabase
      .from('blood_requests')
      .select('*')
      .eq('assigned_bank', profile?.id)
      .order('created_at', { ascending: false })

    if (inventory) {
      const totalUnits = inventory.reduce((sum, item) => sum + item.quantity, 0)
      setStats(prev => ({
        ...prev,
        availableUnits: totalUnits
      }))
    }

    if (requests) {
      setBloodRequests(requests)
      const pending = requests.filter(r => r.status === 'pending')
      
      setStats(prev => ({
        ...prev,
        bloodRequests: requests.length,
        pendingRequests: pending.length
      }))
    }
  }

  const fetchNotifications = async () => {
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile?.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (notifications) {
      setNotifications(notifications)
    }
  }

  const markNotificationAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)

    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    )
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const getRoleSpecificStats = () => {
    switch (profile?.role) {
      case 'donor':
        return [
          {
            title: 'Total Donations',
            value: stats.completedDonations,
            icon: <WaterDropIcon className="h-8 w-8" />,
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
            value: stats.completedDonations * 3,
            icon: <UsersIcon className="h-8 w-8" />,
            color: 'text-green-600',
            bgColor: 'bg-green-100 dark:bg-green-900/20'
          }
        ]
      
      case 'recipient':
        return [
          {
            title: 'Total Requests',
            value: stats.bloodRequests,
            icon: <ExclamationTriangleIcon className="h-8 w-8" />,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100 dark:bg-orange-900/20'
          },
          {
            title: 'Pending',
            value: stats.pendingRequests,
            icon: <ClockIcon className="h-8 w-8" />,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-100 dark:bg-yellow-900/20'
          }
        ]
      
      default:
        return [
          {
            title: 'Available Units',
            value: stats.availableUnits,
            icon: <WaterDropIcon className="h-8 w-8" />,
            color: 'text-red-600',
            bgColor: 'bg-red-100 dark:bg-red-900/20'
          },
          {
            title: 'Pending Requests',
            value: stats.pendingRequests,
            icon: <ClockIcon className="h-8 w-8" />,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-100 dark:bg-yellow-900/20'
          },
          {
            title: 'Total Requests',
            value: stats.bloodRequests,
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
          <div className="grid grid-cols-1 gap-3">
            <Link to="/schedule">
              <Button className="w-full flex items-center justify-center space-x-2">
                <PlusIcon className="h-4 w-4" />
                <span>Schedule Donation</span>
              </Button>
            </Link>
            <Link to="/history">
              <Button variant="outline" className="w-full">
                View Full History
              </Button>
            </Link>
          </div>
        )
      
      case 'recipient':
        return (
          <div className="grid grid-cols-1 gap-3">
            <Link to="/search">
              <Button className="w-full flex items-center justify-center space-x-2">
                <PlusIcon className="h-4 w-4" />
                <span>Request Blood</span>
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
          <div className="grid grid-cols-1 gap-3">
            <Button className="w-full">
              Manage Inventory
            </Button>
            <Button variant="outline" className="w-full">
              Review Requests
            </Button>
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

          {/* Recent Activity / Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Notifications
                </h3>
                <BellIcon className="h-5 w-5 text-gray-400" />
              </div>
              {notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`
                        flex items-start space-x-3 p-3 rounded-lg cursor-pointer transition-colors
                        ${notification.is_read 
                          ? 'bg-gray-50 dark:bg-gray-700' 
                          : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                        }
                      `}
                      onClick={() => !notification.is_read && markNotificationAsRead(notification.id)}
                    >
                      <div className="flex-shrink-0">
                        <div className={`p-2 rounded-full ${
                          notification.is_read 
                            ? 'bg-gray-200 dark:bg-gray-600' 
                            : 'bg-blue-100 dark:bg-blue-900/30'
                        }`}>
                          <BellIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${
                          notification.is_read 
                            ? 'text-gray-600 dark:text-gray-400' 
                            : 'text-gray-900 dark:text-white font-medium'
                        }`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No notifications yet
                  </p>
                </div>
              )}
            </Card>
          </motion.div>
        </div>

        {/* Role-specific content */}
        {profile?.role === 'donor' && scheduledDonations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8"
          >
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Upcoming Donations
              </h3>
              <div className="space-y-3">
                {scheduledDonations.slice(0, 3).map((donation) => (
                  <div key={donation.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
                        <CalendarIcon className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {donation.blood_bank.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(donation.donation_date).toLocaleDateString()} • {donation.blood_group}
                        </p>
                      </div>
                    </div>
                    <Badge variant="info" size="sm">
                      {donation.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Emergency Notice */}
        {profile?.role === 'recipient' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
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
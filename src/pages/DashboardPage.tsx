import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  CalendarIcon, UsersIcon, WaterDropIcon, 
  ExclamationTriangleIcon, ClockIcon, ChartBarIcon, 
  PlusIcon, BellIcon 
} from '../components/icons'
import { useAuth } from '../contexts/AuthContext'
import { supabase, handleSupabaseError } from '../lib/supabase'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
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
  // Use profile + loading from context!
  const { profile, loading: authLoading } = useAuth()

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

  // Wait for the auth to be ready!
  useEffect(() => {
    if (!authLoading && profile) {
      fetchDashboardData()
    }
    // Reset loading while waiting for profile change
    if (authLoading) setLoading(true)
  }, [authLoading, profile])

  // LIVE REALTIME SUBSCRIPTION (notifications etc)
  useEffect(() => {
    if (!profile) return

    // Notifications
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

    // Blood requests real-time updates (only blood bank/admin)
    let requestsChannel: any = null
    if (profile.role === 'blood_bank' || profile.role === 'admin') {
      requestsChannel = supabase
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
      // Clean up!
      notificationChannel.unsubscribe && notificationChannel.unsubscribe()
      requestsChannel && requestsChannel.unsubscribe && requestsChannel.unsubscribe()
    }
  }, [profile])

  // FETCH DATA for each type of user
  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      if (!profile) return
      if (profile.role === 'donor') {
        await fetchDonorData()
      } else if (profile.role === 'recipient') {
        await fetchRecipientData()
      } else if (profile.role === 'blood_bank' || profile.role === 'admin') {
        await fetchBloodBankData()
      }
      await fetchNotifications()
    } catch (err: any) {
      console.error('Dashboard loading failed:', err)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  // --- INDIVIDUAL DATA LOADERS

  const fetchDonorData = async () => {
    try {
      const { data, error } = await supabase
        .schema('bloodbank')
        .from('donation_history')
        .select(`
          id, 
          donation_date, 
          blood_group, 
          status, 
          blood_bank:blood_bank_id (name, phone)
        `)
        .eq('donor_id', profile?.id)
        .order('donation_date', { ascending: false })

      if (error) {
        handleSupabaseError(error, 'fetch donation data')
        return
      }

      const donations = data || []
      setDonationHistory(donations)
      
      const scheduled = donations.filter((d: any) => d.status === 'pending')
      const completed = donations.filter((d: any) => d.status === 'completed')
      
      setScheduledDonations(scheduled)
      setStats(prev => ({
        ...prev,
        totalDonations: donations.length,
        scheduledDonations: scheduled.length,
        completedDonations: completed.length
      }))
    } catch (error) {
      console.error('Error fetching donor data:', error)
      throw error
    }
  }

  const fetchRecipientData = async () => {
    try {
      const { data, error } = await supabase
        .schema('bloodbank')
        .from('blood_requests')
        .select('*')
        .eq('requester_id', profile?.id)
        .order('created_at', { ascending: false })

      if (error) {
        handleSupabaseError(error, 'fetch blood requests')
        return
      }

      const requests = data || []
      setBloodRequests(requests)
      
      const pending = requests.filter((r: any) => r.status === 'pending')
      setStats(prev => ({
        ...prev,
        bloodRequests: requests.length,
        pendingRequests: pending.length
      }))
    } catch (error) {
      console.error('Error fetching recipient data:', error)
      throw error
    }
  }

  const fetchBloodBankData = async () => {
    try {
      // Fetch inventory data
      const { data: inventory, error: inventoryError } = await supabase
        .schema('bloodbank')
        .from('blood_inventory')
        .select('*')
        .eq('blood_bank_id', profile?.id)
        .eq('status', 'available')
        .gte('expiry_date', new Date().toISOString().split('T')[0])
        
      if (inventoryError) {
        handleSupabaseError(inventoryError, 'fetch inventory')
        return
      }

      // Fetch blood requests
      const { data: requests, error: requestsError } = await supabase
        .schema('bloodbank')
        .from('blood_requests')
        .select('*')
        .eq('assigned_bank', profile?.id)
        .order('created_at', { ascending: false })
        
      if (requestsError) {
        handleSupabaseError(requestsError, 'fetch requests')
        return
      }

      const inventoryData = inventory || []
      const requestsData = requests || []
      
      const totalUnits = inventoryData.reduce((sum: number, item: any) => sum + item.quantity, 0)
      const pending = requestsData.filter((r: any) => r.status === 'pending')
      
      setBloodRequests(requestsData)
      setStats(prev => ({
        ...prev,
        availableUnits: totalUnits,
        bloodRequests: requestsData.length,
        pendingRequests: pending.length
      }))
    } catch (error) {
      console.error('Error fetching blood bank data:', error)
      throw error
    }
  }

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .schema('bloodbank')
        .from('notifications')
        .select('*')
        .eq('user_id', profile?.id)
        .order('created_at', { ascending: false })
        .limit(5)
        
      if (error) {
        handleSupabaseError(error, 'fetch notifications')
        return
      }
      
      setNotifications(data || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
      throw error
    }
  }

  // HANDLERS

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .schema('bloodbank')
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        
      if (error) {
        handleSupabaseError(error, 'mark notification as read')
        return
      }
      
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast.error('Failed to mark notification as read')
    }
  }

  // HELPER DISPLAY

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
          { title: 'Total Donations', value: stats.completedDonations, icon: <WaterDropIcon className="h-8 w-8" />, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/20' },
          { title: 'Scheduled', value: stats.scheduledDonations, icon: <CalendarIcon className="h-8 w-8" />, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/20' },
          { title: 'Lives Saved', value: stats.completedDonations * 3, icon: <UsersIcon className="h-8 w-8" />, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/20' }
        ]
      case 'recipient':
        return [
          { title: 'Total Requests', value: stats.bloodRequests, icon: <ExclamationTriangleIcon className="h-8 w-8" />, color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/20' },
          { title: 'Pending', value: stats.pendingRequests, icon: <ClockIcon className="h-8 w-8" />, color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/20' }
        ]
      default:
        return [
          { title: 'Available Units', value: stats.availableUnits, icon: <WaterDropIcon className="h-8 w-8" />, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/20' },
          { title: 'Pending Requests', value: stats.pendingRequests, icon: <ClockIcon className="h-8 w-8" />, color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/20' },
          { title: 'Total Requests', value: stats.bloodRequests, icon: <ChartBarIcon className="h-8 w-8" />, color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/20' }
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
                <PlusIcon className="h-4 w-4" /><span>Schedule Donation</span>
              </Button>
            </Link>
            <Link to="/history"><Button variant="outline" className="w-full">View Full History</Button></Link>
          </div>
        )
      case 'recipient':
        return (
          <div className="grid grid-cols-1 gap-3">
            <Link to="/search">
              <Button className="w-full flex items-center justify-center space-x-2">
                <PlusIcon className="h-4 w-4" /><span>Request Blood</span>
              </Button>
            </Link>
            <Link to="/search"><Button variant="outline" className="w-full">Search Blood Banks</Button></Link>
          </div>
        )
      default:
        return (
          <div className="grid grid-cols-1 gap-3">
            <Button className="w-full">Manage Inventory</Button>
            <Button variant="outline" className="w-full">Review Requests</Button>
          </div>
        )
    }
  }

  // 1. Show loader if we are loading profile/auth or if own loading is true
  if (authLoading || !profile || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const statsData = getRoleSpecificStats()

  // MAIN RENDER

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header, stats, actions */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-2xl font-bold">{getGreeting()}, {profile.name}!</h2>
          {getRoleSpecificActions()}
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 mb-6">
          {statsData.map((stat, idx) => (
            <Card key={stat.title}>
              <div className="flex items-center gap-3">
                <div className={`rounded-lg flex items-center justify-center h-16 w-16 ${stat.bgColor}`}>
                  {stat.icon}
                </div>
                <div>
                  <div className={`text-3xl font-semibold leading-tight ${stat.color}`}>{stat.value}</div>
                  <div className="font-medium">{stat.title}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
        {/* Notifications */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2 font-bold"><BellIcon className="h-5 w-5" /> Notifications</div>
          <div className="space-y-2">
            {notifications.length === 0 && <div className="text-gray-500">No notifications</div>}
            {notifications.map((n) => (
              <Card key={n.id} className={`flex items-center gap-4 p-3 ${n.is_read ? 'opacity-50' : ''}`}>
                <div className="flex-1">{n.message}</div>
                {!n.is_read && (
                  <Button size="sm" onClick={() => markNotificationAsRead(n.id)}>Mark as read</Button>
                )}
                <span className="text-sm text-gray-400">{new Date(n.created_at).toLocaleString()}</span>
              </Card>
            ))}
          </div>
        </div>
        {/* Role-specific dashboard sections can be added here */}
      </div>
    </div>
  )
}
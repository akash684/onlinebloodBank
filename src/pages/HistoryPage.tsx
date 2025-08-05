import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ClockIcon,
  WaterDropIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  FunnelIcon
} from '../components/icons'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Select } from '../components/ui/Select'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

interface DonationRecord {
  id: string
  donation_date: string
  blood_group: string
  status: 'completed' | 'pending' | 'cancelled'
  blood_bank: {
    name: string
    phone: string
  }
}

interface BloodRequest {
  id: string
  blood_group: string
  quantity: number
  status: 'pending' | 'approved' | 'denied' | 'fulfilled'
  created_at: string
  patient_name?: string
  urgency?: string
  hospital_name?: string
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'approved', label: 'Approved' },
  { value: 'denied', label: 'Denied' },
  { value: 'fulfilled', label: 'Fulfilled' }
]

export const HistoryPage: React.FC = () => {
  const { profile } = useAuth()
  const [donations, setDonations] = useState<DonationRecord[]>([])
  const [requests, setRequests] = useState<BloodRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [activeTab, setActiveTab] = useState<'donations' | 'requests'>('donations')

  useEffect(() => {
    fetchHistory()
  }, [profile])

  const fetchHistory = async () => {
    if (!profile) return

    try {
      setLoading(true)

      if (profile.role === 'donor') {
        // Fetch donation history
        const { data: donationData, error: donationError } = await supabase
          .from('donation_history')
          .select(`
            *,
            blood_bank:blood_bank_id (name, phone)
          `)
          .eq('donor_id', profile.id)
          .order('donation_date', { ascending: false })

        if (donationError) throw donationError
        setDonations(donationData || [])
      }

      if (profile.role === 'recipient' || profile.role === 'blood_bank' || profile.role === 'admin') {
        // Fetch blood requests
        let requestQuery = supabase
          .from('blood_requests')
          .select('*')
          .order('created_at', { ascending: false })

        if (profile.role === 'recipient') {
          requestQuery = requestQuery.eq('requester_id', profile.id)
        } else if (profile.role === 'blood_bank') {
          requestQuery = requestQuery.eq('assigned_bank', profile.id)
        }

        const { data: requestData, error: requestError } = await requestQuery

        if (requestError) throw requestError
        setRequests(requestData || [])
      }

      // Set default tab based on role
      if (profile.role === 'recipient') {
        setActiveTab('requests')
      }

    } catch (error) {
      console.error('Error fetching history:', error)
      toast.error('Failed to load history')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'fulfilled':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'cancelled':
      case 'denied':
        return <XCircleIcon className="h-4 w-4" />
      case 'pending':
      case 'approved':
        return <ExclamationCircleIcon className="h-4 w-4" />
      default:
        return <ClockIcon className="h-4 w-4" />
    }
  }

  const getStatusVariant = (status: string): 'success' | 'warning' | 'danger' | 'info' => {
    switch (status) {
      case 'completed':
      case 'fulfilled':
        return 'success'
      case 'cancelled':
      case 'denied':
        return 'danger'
      case 'pending':
        return 'warning'
      case 'approved':
        return 'info'
      default:
        return 'info'
    }
  }

  const filteredDonations = donations.filter(donation => 
    !statusFilter || donation.status === statusFilter
  )

  const filteredRequests = requests.filter(request => 
    !statusFilter || request.status === statusFilter
  )

  const getStats = () => {
    if (profile?.role === 'donor') {
      const completed = donations.filter(d => d.status === 'completed').length
      const pending = donations.filter(d => d.status === 'pending').length
      const cancelled = donations.filter(d => d.status === 'cancelled').length
      
      return [
        { label: 'Total Donations', value: donations.length, color: 'text-blue-600' },
        { label: 'Completed', value: completed, color: 'text-green-600' },
        { label: 'Pending', value: pending, color: 'text-yellow-600' },
        { label: 'Lives Saved', value: completed * 3, color: 'text-red-600' }
      ]
    } else {
      const pending = requests.filter(r => r.status === 'pending').length
      const approved = requests.filter(r => r.status === 'approved').length
      const fulfilled = requests.filter(r => r.status === 'fulfilled').length
      
      return [
        { label: 'Total Requests', value: requests.length, color: 'text-blue-600' },
        { label: 'Pending', value: pending, color: 'text-yellow-600' },
        { label: 'Approved', value: approved, color: 'text-green-600' },
        { label: 'Fulfilled', value: fulfilled, color: 'text-red-600' }
      ]
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const stats = getStats()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex justify-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-lg"
            >
              <ClockIcon className="h-12 w-12 text-white" />
            </motion.div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-4">
            {profile?.role === 'donor' ? 'Donation History' : 'Request History'}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {profile?.role === 'donor' 
              ? 'Track your donation journey and see the impact you\'ve made.'
              : 'View your blood requests and their current status.'
            }
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-4 text-center">
                <div className={`text-2xl font-bold ${stat.color} mb-1`}>
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tabs and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <Card className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              {/* Tabs */}
              {(profile?.role === 'blood_bank' || profile?.role === 'admin') && (
                <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab('donations')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'donations'
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Donations
                  </button>
                  <button
                    onClick={() => setActiveTab('requests')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'requests'
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Requests
                  </button>
                </div>
              )}

              {/* Filter */}
              <div className="flex items-center space-x-3">
                <FunnelIcon className="h-5 w-5 text-gray-400" />
                <Select
                  options={STATUS_OPTIONS}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-40"
                />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {activeTab === 'donations' && (profile?.role === 'donor' || profile?.role === 'blood_bank' || profile?.role === 'admin') ? (
            <div className="space-y-4">
              {filteredDonations.length > 0 ? (
                filteredDonations.map((donation, index) => (
                  <motion.div
                    key={donation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card hover className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                            <WaterDropIcon className="h-6 w-6 text-red-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              Blood Donation
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                              <div className="flex items-center space-x-1">
                                <CalendarIcon className="h-4 w-4" />
                                <span>{new Date(donation.donation_date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <WaterDropIcon className="h-4 w-4" />
                                <span>{donation.blood_group}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <BuildingOfficeIcon className="h-4 w-4" />
                                <span>{donation.blood_bank.name}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge 
                            variant={getStatusVariant(donation.status)}
                            className="flex items-center space-x-1"
                          >
                            {getStatusIcon(donation.status)}
                            <span className="capitalize">{donation.status}</span>
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <Card className="p-12 text-center">
                  <WaterDropIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No donations found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {statusFilter ? 'No donations match the selected filter.' : 'You haven\'t made any donations yet.'}
                  </p>
                </Card>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.length > 0 ? (
                filteredRequests.map((request, index) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card hover className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                            <ExclamationCircleIcon className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              Blood Request
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                              <div className="flex items-center space-x-1">
                                <CalendarIcon className="h-4 w-4" />
                                <span>{new Date(request.created_at).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <WaterDropIcon className="h-4 w-4" />
                                <span>{request.blood_group} • {request.quantity} units</span>
                              </div>
                              {request.patient_name && (
                                <span>Patient: {request.patient_name}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {request.urgency && (
                            <Badge 
                              variant={request.urgency === 'critical' ? 'danger' : 'warning'}
                              size="sm"
                            >
                              {request.urgency}
                            </Badge>
                          )}
                          <Badge 
                            variant={getStatusVariant(request.status)}
                            className="flex items-center space-x-1"
                          >
                            {getStatusIcon(request.status)}
                            <span className="capitalize">{request.status}</span>
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <Card className="p-12 text-center">
                  <ExclamationCircleIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No requests found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {statusFilter ? 'No requests match the selected filter.' : 'No blood requests have been made yet.'}
                  </p>
                </Card>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
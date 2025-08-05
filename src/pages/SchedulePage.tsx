import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  WaterDropIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '../components/icons'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

interface BloodBank {
  id: string
  name: string
  phone: string
  email: string
}

const TIME_SLOTS = [
  { value: '09:00', label: '9:00 AM' },
  { value: '10:00', label: '10:00 AM' },
  { value: '11:00', label: '11:00 AM' },
  { value: '14:00', label: '2:00 PM' },
  { value: '15:00', label: '3:00 PM' },
  { value: '16:00', label: '4:00 PM' },
]

export const SchedulePage: React.FC = () => {
  const { profile } = useAuth()
  const [bloodBanks, setBloodBanks] = useState<BloodBank[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    blood_bank_id: '',
    donation_date: '',
    time_slot: '09:00',
    notes: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchBloodBanks()
  }, [])

  const fetchBloodBanks = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, phone, email')
        .eq('role', 'blood_bank')
        .eq('is_active', true)

      if (error) throw error
      setBloodBanks(data || [])
    } catch (error) {
      console.error('Error fetching blood banks:', error)
      toast.error('Failed to load blood banks')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.blood_bank_id) {
      newErrors.blood_bank_id = 'Please select a blood bank'
    }

    if (!formData.donation_date) {
      newErrors.donation_date = 'Please select a donation date'
    } else {
      const selectedDate = new Date(formData.donation_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (selectedDate < today) {
        newErrors.donation_date = 'Please select a future date'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setSubmitting(true)
    try {
      // Create donation appointment
      const { error } = await supabase
        .from('donation_history')
        .insert([{
          donor_id: profile?.id,
          blood_bank_id: formData.blood_bank_id,
          donation_date: formData.donation_date,
          blood_group: profile?.blood_type,
          status: 'pending'
        }])

      if (error) throw error

      // Create notification for blood bank
      const selectedBloodBank = bloodBanks.find(bb => bb.id === formData.blood_bank_id)
      if (selectedBloodBank) {
        await supabase
          .from('notifications')
          .insert([{
            user_id: formData.blood_bank_id,
            message: `New donation appointment scheduled by ${profile?.name} for ${new Date(formData.donation_date).toLocaleDateString()}`,
            type: 'donation_scheduled'
          }])
      }

      toast.success('Donation appointment scheduled successfully!')
      
      // Reset form
      setFormData({
        blood_bank_id: '',
        donation_date: '',
        time_slot: '09:00',
        notes: ''
      })

    } catch (error: any) {
      console.error('Error scheduling donation:', error)
      toast.error('Failed to schedule donation. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const getMinDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
              className="p-4 bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-lg"
            >
              <CalendarIcon className="h-12 w-12 text-white" />
            </motion.div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent mb-4">
            Schedule Blood Donation
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Book your donation appointment at a convenient time and location.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Donation Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Appointment Details
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <Select
                  label="Select Blood Bank"
                  name="blood_bank_id"
                  value={formData.blood_bank_id}
                  onChange={handleChange}
                  options={[
                    { value: '', label: 'Choose a blood bank...' },
                    ...bloodBanks.map(bb => ({ value: bb.id, label: bb.name }))
                  ]}
                  error={errors.blood_bank_id}
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Donation Date"
                    type="date"
                    name="donation_date"
                    value={formData.donation_date}
                    onChange={handleChange}
                    min={getMinDate()}
                    error={errors.donation_date}
                    icon={<CalendarIcon className="h-5 w-5" />}
                    required
                  />

                  <Select
                    label="Preferred Time"
                    name="time_slot"
                    value={formData.time_slot}
                    onChange={handleChange}
                    options={TIME_SLOTS}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Any special requirements or medical conditions we should know about..."
                  />
                </div>

                <Button
                  type="submit"
                  loading={submitting}
                  className="w-full"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Schedule Appointment
                </Button>
              </form>
            </Card>
          </motion.div>

          {/* Sidebar Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Donor Info */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Your Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
                    <WaterDropIcon className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Blood Type</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {profile?.blood_type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                    <ClockIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Donor Since</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {new Date(profile?.created_at || '').getFullYear()}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Donation Guidelines */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Before You Donate
              </h3>
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-start space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Get a good night's sleep</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Eat a healthy meal before donating</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Drink plenty of water</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Bring a valid ID</span>
                </div>
                <div className="flex items-start space-x-2">
                  <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>Avoid alcohol 24 hours before</span>
                </div>
              </div>
            </Card>

            {/* Emergency Contact */}
            <Card className="p-6 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10">
              <h4 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">
                Need Help?
              </h4>
              <p className="text-red-700 dark:text-red-300 text-sm">
                For urgent scheduling or questions, call our helpline:
              </p>
              <p className="text-red-800 dark:text-red-400 font-bold text-lg mt-1">
                1-800-BLOOD
              </p>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
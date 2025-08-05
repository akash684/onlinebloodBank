import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  XMarkIcon,
  BeakerIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { supabase, handleSupabaseError } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Card } from '../ui/Card'
import toast from 'react-hot-toast'

interface BloodBankResult {
  id: string
  name: string
  phone: string
  email: string
  bloodTypes: { type: string; quantity: number; expiry: string; inventoryId: string }[]
  totalUnits: number
}

interface BloodRequestModalProps {
  bloodBank: BloodBankResult
  onClose: () => void
  onSuccess: () => void
}

const URGENCY_LEVELS = [
  { value: 'low', label: 'Low - Routine' },
  { value: 'medium', label: 'Medium - Planned Surgery' },
  { value: 'high', label: 'High - Urgent' },
  { value: 'critical', label: 'Critical - Emergency' }
]

export const BloodRequestModal: React.FC<BloodRequestModalProps> = ({
  bloodBank,
  onClose,
  onSuccess
}) => {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    blood_group: '',
    quantity: 1,
    urgency: 'medium',
    reason: '',
    patient_name: '',
    contact_number: profile?.phone || '',
    hospital_name: '',
    required_by: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const availableBloodTypes = bloodBank.bloodTypes.map(bt => ({
    value: bt.type,
    label: `${bt.type} (${bt.quantity} units available)`
  }))

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 1 : value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.blood_group) {
      newErrors.blood_group = 'Blood type is required'
    }

    if (formData.quantity < 1) {
      newErrors.quantity = 'Quantity must be at least 1'
    }

    const selectedBloodType = bloodBank.bloodTypes.find(bt => bt.type === formData.blood_group)
    if (selectedBloodType && formData.quantity > selectedBloodType.quantity) {
      newErrors.quantity = `Only ${selectedBloodType.quantity} units available`
    }

    if (!formData.urgency) {
      newErrors.urgency = 'Urgency level is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.patient_name.trim()) {
      newErrors.patient_name = 'Patient name is required'
    }

    if (!formData.contact_number.trim()) {
      newErrors.contact_number = 'Contact number is required'
    }

    if (!formData.hospital_name.trim()) {
      newErrors.hospital_name = 'Hospital/Organization name is required'
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason for request is required'
    }

    if (!formData.required_by) {
      newErrors.required_by = 'Required by date is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2)
    }
  }

  const handleSubmit = async () => {
    if (!validateStep2()) return

    setLoading(true)
    try {
      // Validate user permissions
      if (!user || !profile) {
        throw new Error('User not authenticated')
      }

      if (profile.role !== 'recipient' && profile.role !== 'admin') {
        throw new Error('Only recipients and admins can create blood requests')
      }

      // Check if blood bank has sufficient inventory
      const { data: inventory, error: inventoryError } = await supabase
        .from('blood_inventory')
        .select('quantity')
        .eq('blood_bank_id', bloodBank.id)
        .eq('blood_group', formData.blood_group)
        .eq('status', 'available')
        .gte('expiry_date', new Date().toISOString().split('T')[0])

      if (inventoryError) {
        handleSupabaseError(inventoryError, 'check inventory')
        return
      }

      const totalAvailable = inventory?.reduce((sum, item) => sum + item.quantity, 0) || 0
      if (totalAvailable < formData.quantity) {
        throw new Error(`Insufficient inventory. Only ${totalAvailable} units available.`)
      }

      // Create blood request
      const { error } = await supabase
        .from('blood_requests')
        .insert([{
          requester_id: user?.id,
          blood_group: formData.blood_group,
          quantity: formData.quantity,
          assigned_bank: bloodBank.id,
          status: 'pending',
          urgency: formData.urgency,
          reason: formData.reason,
          patient_name: formData.patient_name,
          contact_number: formData.contact_number,
          hospital_name: formData.hospital_name,
          required_by: formData.required_by
        }])

      if (error) {
        handleSupabaseError(error, 'create blood request')
        return
      }

      // Create notification for blood bank
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert([{
          user_id: bloodBank.id,
          message: `New ${formData.urgency} priority blood request: ${formData.quantity} units of ${formData.blood_group} from ${formData.hospital_name}`,
          type: 'blood_request'
        }])

      if (notificationError) {
        console.warn('Failed to create notification:', notificationError)
        // Don't fail the entire operation for notification errors
      }

      toast.success('Blood request submitted successfully!')
      onSuccess()
    } catch (error: any) {
      console.error('Error submitting request:', error)
      const message = error instanceof Error ? error.message : 'Failed to submit blood request. Please try again.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <Card className="bg-white dark:bg-gray-800 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <BeakerIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Request Blood
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {bloodBank.name}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Progress Indicator */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50">
              <div className="flex items-center space-x-4">
                <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-red-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= 1 ? 'bg-red-600 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    1
                  </div>
                  <span className="text-sm font-medium">Blood Details</span>
                </div>
                <div className={`flex-1 h-1 rounded ${step >= 2 ? 'bg-red-600' : 'bg-gray-300'}`} />
                <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-red-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= 2 ? 'bg-red-600 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    2
                  </div>
                  <span className="text-sm font-medium">Request Details</span>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-6">
              {step === 1 ? (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Blood Type"
                      name="blood_group"
                      value={formData.blood_group}
                      onChange={handleChange}
                      options={[
                        { value: '', label: 'Select blood type' },
                        ...availableBloodTypes
                      ]}
                      error={errors.blood_group}
                      required
                    />

                    <Input
                      label="Quantity (Units)"
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      min="1"
                      error={errors.quantity}
                      required
                    />
                  </div>

                  <Select
                    label="Urgency Level"
                    name="urgency"
                    value={formData.urgency}
                    onChange={handleChange}
                    options={URGENCY_LEVELS}
                    error={errors.urgency}
                    required
                  />

                  {formData.urgency === 'critical' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                    >
                      <div className="flex items-center space-x-2">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                        <span className="text-sm font-medium text-red-800 dark:text-red-400">
                          Critical requests will be prioritized and processed immediately.
                        </span>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Patient Name"
                      name="patient_name"
                      value={formData.patient_name}
                      onChange={handleChange}
                      error={errors.patient_name}
                      required
                    />

                    <Input
                      label="Contact Number"
                      name="contact_number"
                      value={formData.contact_number}
                      onChange={handleChange}
                      error={errors.contact_number}
                      required
                    />
                  </div>

                  <Input
                    label="Hospital/Organization Name"
                    name="hospital_name"
                    value={formData.hospital_name}
                    onChange={handleChange}
                    error={errors.hospital_name}
                    required
                  />

                  <Input
                    label="Required By Date"
                    type="date"
                    name="required_by"
                    value={formData.required_by}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    error={errors.required_by}
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Reason for Request *
                    </label>
                    <textarea
                      name="reason"
                      value={formData.reason}
                      onChange={handleChange}
                      rows={3}
                      className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Please provide details about the medical condition or procedure requiring blood transfusion..."
                    />
                    {errors.reason && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.reason}</p>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700">
              {step === 1 ? (
                <>
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button onClick={handleNext}>
                    Next Step
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button onClick={handleSubmit} loading={loading}>
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Submit Request
                  </Button>
                </>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
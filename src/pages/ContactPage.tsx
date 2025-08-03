import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ClockIcon,
  PaperAirplaneIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { supabase } from '../lib/supabase'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import toast from 'react-hot-toast'

const INQUIRY_TYPES = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'donation', label: 'Blood Donation' },
  { value: 'request', label: 'Blood Request' },
  { value: 'partnership', label: 'Hospital Partnership' },
  { value: 'technical', label: 'Technical Support' },
  { value: 'emergency', label: 'Emergency' }
]

export const ContactPage: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    inquiry_type: 'general',
    subject: '',
    message: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required'
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required'
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      // In a real application, you might want to create a contact_messages table
      // For now, we'll just show a success message
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success('Message sent successfully! We\'ll get back to you soon.')
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        inquiry_type: 'general',
        subject: '',
        message: ''
      })

    } catch (error: any) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const contactInfo = [
    {
      icon: <PhoneIcon className="h-6 w-6" />,
      title: '24/7 Emergency Hotline',
      details: '1-800-BLOOD',
      description: 'For urgent blood requirements',
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/20'
    },
    {
      icon: <EnvelopeIcon className="h-6 w-6" />,
      title: 'Email Support',
      details: 'support@bloodbankplus.org',
      description: 'General inquiries and support',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      icon: <MapPinIcon className="h-6 w-6" />,
      title: 'Headquarters',
      details: '123 Healthcare Ave, Medical District',
      description: 'New York, NY 10001',
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      icon: <ClockIcon className="h-6 w-6" />,
      title: 'Business Hours',
      details: 'Mon-Fri: 8:00 AM - 6:00 PM',
      description: 'Emergency services: 24/7',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    }
  ]

  const emergencyContacts = [
    {
      region: 'North America',
      phone: '+1-800-BLOOD-1',
      email: 'emergency.na@bloodbankplus.org'
    },
    {
      region: 'Europe',
      phone: '+44-800-BLOOD-2',
      email: 'emergency.eu@bloodbankplus.org'
    },
    {
      region: 'Asia Pacific',
      phone: '+65-800-BLOOD-3',
      email: 'emergency.ap@bloodbankplus.org'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-lg"
            >
              <PhoneIcon className="h-12 w-12 text-white" />
            </motion.div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-4">
            Contact Us
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Get in touch with our team for support, partnerships, or emergency blood requirements.
          </p>
        </motion.div>

        {/* Emergency Alert */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="p-6 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600 mr-4" />
              <div>
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-400">
                  Emergency Blood Needed?
                </h3>
                <p className="text-red-700 dark:text-red-300 mt-1">
                  For life-threatening situations requiring immediate blood, call our 24/7 emergency hotline: 
                  <span className="font-bold text-xl ml-2">1-800-BLOOD</span>
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="p-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Send us a Message
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name}
                    placeholder="Enter your full name"
                    required
                  />

                  <Input
                    label="Email Address"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Phone Number (Optional)"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                  />

                  <Select
                    label="Inquiry Type"
                    name="inquiry_type"
                    value={formData.inquiry_type}
                    onChange={handleChange}
                    options={INQUIRY_TYPES}
                    required
                  />
                </div>

                <Input
                  label="Subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  error={errors.subject}
                  placeholder="Brief description of your inquiry"
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Please provide details about your inquiry..."
                    required
                  />
                  {errors.message && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  loading={loading}
                  className="w-full"
                >
                  <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </form>
            </Card>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Contact Details */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Get in Touch
              </h3>
              <div className="space-y-4">
                {contactInfo.map((info, index) => (
                  <div key={info.title} className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${info.bgColor}`}>
                      <div className={info.color}>
                        {info.icon}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {info.title}
                      </h4>
                      <p className="text-gray-900 dark:text-white font-semibold">
                        {info.details}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {info.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Emergency Contacts */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Regional Emergency Contacts
              </h3>
              <div className="space-y-4">
                {emergencyContacts.map((contact, index) => (
                  <div key={contact.region} className="border-l-2 border-red-500 pl-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {contact.region}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Phone: {contact.phone}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Email: {contact.email}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            {/* FAQ Link */}
            <Card className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
              <div className="flex items-center space-x-3">
                <CheckCircleIcon className="h-8 w-8 text-blue-600" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Quick Answers
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Check our FAQ section for common questions about blood donation, 
                    eligibility, and our services.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Map Section (Placeholder) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12"
        >
          <Card className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Find Us
            </h3>
            <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-64 flex items-center justify-center">
              <div className="text-center">
                <MapPinIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">
                  Interactive map would be displayed here
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  123 Healthcare Ave, Medical District, New York, NY 10001
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
import React from 'react'
import { motion } from 'framer-motion'
import { BeakerIcon, ClockIcon } from '@heroicons/react/24/outline'
import { Badge } from '../ui/Badge'

interface BloodTypeCardProps {
  bloodType: {
    type: string
    quantity: number
    expiry: string
    inventoryId: string
  }
  getUrgencyColor: (quantity: number) => 'success' | 'warning' | 'danger'
  formatExpiryDate: (date: string) => { text: string; urgent: boolean }
  className?: string
}

export const BloodTypeCard: React.FC<BloodTypeCardProps> = ({
  bloodType,
  getUrgencyColor,
  formatExpiryDate,
  className = ''
}) => {
  const expiryInfo = formatExpiryDate(bloodType.expiry)
  const urgencyColor = getUrgencyColor(bloodType.quantity)

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative overflow-hidden rounded-xl p-4 
        bg-gradient-to-br from-white to-gray-50 
        dark:from-gray-700 dark:to-gray-800
        border border-gray-200 dark:border-gray-600
        shadow-md hover:shadow-lg transition-all duration-200
        ${className}
      `}
    >
      {/* Blood Type Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <BeakerIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {bloodType.type}
          </span>
        </div>
        
        <Badge variant={urgencyColor} size="sm">
          {bloodType.quantity} units
        </Badge>
      </div>

      {/* Quantity Indicator */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Available
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {bloodType.quantity} / 20
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((bloodType.quantity / 20) * 100, 100)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`
              h-2 rounded-full transition-colors duration-200
              ${urgencyColor === 'success' ? 'bg-green-500' : 
                urgencyColor === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}
            `}
          />
        </div>
      </div>

      {/* Expiry Information */}
      <div className="flex items-center space-x-2 text-xs">
        <ClockIcon className="h-4 w-4 text-gray-400" />
        <span className={`
          ${expiryInfo.urgent ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-500 dark:text-gray-400'}
        `}>
          Expires: {expiryInfo.text}
        </span>
      </div>

      {/* Urgent indicator */}
      {expiryInfo.urgent && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-2 right-2"
        >
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        </motion.div>
      )}

      {/* Low stock indicator */}
      {bloodType.quantity <= 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-red-500/5 dark:bg-red-500/10 rounded-xl"
        />
      )}
    </motion.div>
  )
}
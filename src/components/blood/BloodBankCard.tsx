import React from 'react'
import { motion } from 'framer-motion'
import {
  MapPinIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { BloodTypeCard } from './BloodTypeCard'

interface BloodBankResult {
  id: string
  name: string
  phone: string
  email: string
  bloodTypes: { type: string; quantity: number; expiry: string; inventoryId: string }[]
  totalUnits: number
}

interface BloodBankCardProps {
  bloodBank: BloodBankResult
  onRequestBlood: (bloodBank: BloodBankResult) => void
  formatExpiryDate: (date: string) => { text: string; urgent: boolean }
  getUrgencyColor: (quantity: number) => 'success' | 'warning' | 'danger'
}

export const BloodBankCard: React.FC<BloodBankCardProps> = ({
  bloodBank,
  onRequestBlood,
  formatExpiryDate,
  getUrgencyColor
}) => {
  const hasLowStock = bloodBank.bloodTypes.some(bt => bt.quantity <= 3)
  const hasUrgentExpiry = bloodBank.bloodTypes.some(bt => 
    formatExpiryDate(bt.expiry).urgent
  )

  return (
    <Card className="overflow-hidden bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-gradient-to-r from-red-500 to-red-600 rounded-lg">
                    <BuildingOfficeIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {bloodBank.name}
                    </h3>
                    {(hasLowStock || hasUrgentExpiry) && (
                      <div className="flex space-x-2 mt-1">
                        {hasLowStock && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                            Low Stock
                          </span>
                        )}
                        {hasUrgentExpiry && (
                          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                            Expiring Soon
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <PhoneIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{bloodBank.phone}</span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <EnvelopeIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{bloodBank.email}</span>
                  </div>
                </div>
              </div>

              <div className="text-right ml-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent"
                >
                  {bloodBank.totalUnits}
                </motion.div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Total Units
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Blood Types Grid */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-2" />
            Available Blood Types
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {bloodBank.bloodTypes.map((bloodType, index) => (
              <motion.div
                key={`${bloodType.type}-${bloodType.inventoryId}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <BloodTypeCard
                  bloodType={bloodType}
                  getUrgencyColor={getUrgencyColor}
                  formatExpiryDate={formatExpiryDate}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => onRequestBlood(bloodBank)}
            className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 transform transition-all duration-200 hover:scale-105"
          >
            <BuildingOfficeIcon className="h-4 w-4 mr-2" />
            Request Blood
          </Button>
          
          <Button
            variant="outline"
            onClick={() => window.open(`tel:${bloodBank.phone}`, '_self')}
            className="flex-1 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <PhoneIcon className="h-4 w-4 mr-2" />
            Call Now
          </Button>
        </div>
      </div>

      {/* Gradient overlay for visual appeal */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-red-500/5 pointer-events-none" />
    </Card>
  )
}
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  MagnifyingGlassIcon,
  MapPinIcon,
  DropletIcon,
  BuildingOfficeIcon,
  PhoneIcon
} from '@heroicons/react/24/outline'
import { supabase } from '../lib/supabase'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

const BLOOD_TYPES = [
  { value: '', label: 'All Blood Types' },
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' }
]

interface BloodBankResult {
  id: string
  name: string
  location: string
  phone: string
  bloodTypes: { type: string; quantity: number; expiry: string }[]
  totalUnits: number
  distance?: number
}

export const SearchPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBloodType, setSelectedBloodType] = useState('')
  const [location, setLocation] = useState('')
  const [results, setResults] = useState<BloodBankResult[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // Sample data - in a real app, this would come from your database
  const sampleResults: BloodBankResult[] = [
    {
      id: '1',
      name: 'City General Blood Bank',
      location: 'Downtown Medical Center, 123 Main St',
      phone: '+1 (555) 123-4567',
      totalUnits: 45,
      bloodTypes: [
        { type: 'O+', quantity: 12, expiry: '2025-02-15' },
        { type: 'A+', quantity: 8, expiry: '2025-02-10' },
        { type: 'B+', quantity: 6, expiry: '2025-02-12' },
        { type: 'AB+', quantity: 4, expiry: '2025-02-08' }
      ]
    },
    {
      id: '2',
      name: 'Regional Medical Blood Services',
      location: 'North Campus, 456 Health Ave',
      phone: '+1 (555) 987-6543',
      totalUnits: 32,
      bloodTypes: [
        { type: 'O-', quantity: 5, expiry: '2025-02-18' },
        { type: 'A-', quantity: 7, expiry: '2025-02-14' },
        { type: 'B-', quantity: 3, expiry: '2025-02-16' },
        { type: 'O+', quantity: 10, expiry: '2025-02-11' }
      ]
    },
    {
      id: '3',
      name: 'Community Blood Center',
      location: 'Westside Medical Plaza, 789 Care Blvd',
      phone: '+1 (555) 456-7890',
      totalUnits: 28,
      bloodTypes: [
        { type: 'A+', quantity: 9, expiry: '2025-02-13' },
        { type: 'AB-', quantity: 2, expiry: '2025-02-09' },
        { type: 'B+', quantity: 8, expiry: '2025-02-17' },
        { type: 'O+', quantity: 6, expiry: '2025-02-12' }
      ]
    }
  ]

  const handleSearch = async () => {
    setLoading(true)
    setHasSearched(true)
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Filter results based on search criteria
      let filteredResults = sampleResults
      
      if (searchQuery) {
        filteredResults = filteredResults.filter(result => 
          result.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          result.location.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }
      
      if (selectedBloodType) {
        filteredResults = filteredResults.filter(result =>
          result.bloodTypes.some(bt => bt.type === selectedBloodType && bt.quantity > 0)
        )
      }
      
      if (location) {
        filteredResults = filteredResults.filter(result =>
          result.location.toLowerCase().includes(location.toLowerCase())
        )
      }
      
      setResults(filteredResults)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const getUrgencyColor = (quantity: number) => {
    if (quantity <= 3) return 'danger'
    if (quantity <= 7) return 'warning'
    return 'success'
  }

  const formatExpiryDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays <= 3) return `${diffDays} days`
    if (diffDays <= 7) return `${diffDays} days`
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Find Blood Banks & Available Blood
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Search for blood banks in your area and check real-time blood availability.
          </p>
        </motion.div>

        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Search blood banks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                icon={<MagnifyingGlassIcon className="h-5 w-5" />}
              />
              
              <Select
                options={BLOOD_TYPES}
                value={selectedBloodType}
                onChange={(e) => setSelectedBloodType(e.target.value)}
                className="w-full"
              />
              
              <Input
                placeholder="Location/City"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyPress={handleKeyPress}
                icon={<MapPinIcon className="h-5 w-5" />}
              />
              
              <Button
                onClick={handleSearch}
                loading={loading}
                className="w-full"
              >
                Search
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : hasSearched ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {results.length > 0 ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Found {results.length} blood bank{results.length !== 1 ? 's' : ''}
                  </h2>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Good Stock</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span>Low Stock</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>Critical</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {results.map((result, index) => (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card hover className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                  {result.name}
                                </h3>
                                <div className="flex items-center text-gray-600 dark:text-gray-400 mb-2">
                                  <MapPinIcon className="h-4 w-4 mr-2" />
                                  <span>{result.location}</span>
                                </div>
                                <div className="flex items-center text-gray-600 dark:text-gray-400">
                                  <PhoneIcon className="h-4 w-4 mr-2" />
                                  <span>{result.phone}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                  {result.totalUnits}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Total Units
                                </div>
                              </div>
                            </div>
                            
                            {/* Available Blood Types */}
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                Available Blood Types:
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {result.bloodTypes.map((bloodType) => (
                                  <div
                                    key={bloodType.type}
                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <DropletIcon className="h-4 w-4 text-red-600" />
                                      <span className="font-medium text-gray-900 dark:text-white">
                                        {bloodType.type}
                                      </span>
                                    </div>
                                    <div className="text-right">
                                      <Badge
                                        variant={getUrgencyColor(bloodType.quantity)}
                                        size="sm"
                                      >
                                        {bloodType.quantity}
                                      </Badge>
                                      <div className="text-xs text-gray-500 mt-1">
                                        Exp: {formatExpiryDate(bloodType.expiry)}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          <div className="lg:ml-6 mt-4 lg:mt-0">
                            <Button className="w-full lg:w-auto">
                              <BuildingOfficeIcon className="h-4 w-4 mr-2" />
                              Contact Blood Bank
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <MagnifyingGlassIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No blood banks found
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Try adjusting your search criteria or location.
                </p>
                <Button variant="outline" onClick={() => {
                  setSearchQuery('')
                  setSelectedBloodType('')
                  setLocation('')
                  setHasSearched(false)
                  setResults([])
                }}>
                  Clear Search
                </Button>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <DropletIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Search for Blood Banks
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Enter your search criteria above to find blood banks and check availability.
            </p>
          </motion.div>
        )}

        {/* Emergency Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <Card className="p-6 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10">
            <div className="flex items-center">
              <PhoneIcon className="h-6 w-6 text-red-600 mr-3" />
              <div>
                <h4 className="text-lg font-semibold text-red-800 dark:text-red-400">
                  Emergency Blood Needed?
                </h4>
                <p className="text-red-700 dark:text-red-300 mt-1">
                  For critical blood requirements, call our 24/7 emergency hotline: <strong>1-800-BLOOD</strong>
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
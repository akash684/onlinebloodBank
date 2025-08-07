import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  BeakerIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '../components/icons'
import { supabase, handleSupabaseError } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { BloodTypeCard } from '../components/blood/BloodTypeCard'
import { BloodRequestModal } from '../components/blood/BloodRequestModal'
import { BloodBankCard } from '../components/blood/BloodBankCard'
import toast from 'react-hot-toast'

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

interface BloodInventory {
  id: string
  blood_group: string
  quantity: number
  expiry_date: string
  status: string
  blood_bank: {
    id: string
    name: string
    phone: string
    email: string
  }
}

interface BloodBankResult {
  id: string
  name: string
  phone: string
  email: string
  bloodTypes: { type: string; quantity: number; expiry: string; inventoryId: string }[]
  totalUnits: number
}

export const SearchPage: React.FC = () => {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBloodType, setSelectedBloodType] = useState('')
  const [location, setLocation] = useState('')
  const [results, setResults] = useState<BloodBankResult[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [selectedBloodBank, setSelectedBloodBank] = useState<BloodBankResult | null>(null)
  const [realtimeSubscription, setRealtimeSubscription] = useState<any>(null)

  useEffect(() => {
    // Set up real-time subscription for inventory updates
    const subscription = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'bloodbank',
          table: 'blood_inventory'
        },
        (payload) => {
          console.log('Inventory updated:', payload)
          if (hasSearched) {
            handleSearch() // Refresh search results
          }
        }
      )
      .subscribe()

    setRealtimeSubscription(subscription)

    return () => {
      if (realtimeSubscription) {
        supabase.removeChannel(realtimeSubscription)
      }
    }
  }, [hasSearched])

  const handleSearch = async () => {
    setLoading(true)
    setHasSearched(true)

    try {
      // First, get blood banks that match search criteria
      let bloodBankQuery = supabase
        .schema('bloodbank')
        .from('users')
        .select('id, name, phone, email')
        .eq('role', 'blood_bank')
        .eq('is_active', true)

      // Apply search query filter (blood bank name)
      if (searchQuery.trim()) {
        bloodBankQuery = bloodBankQuery.ilike('name', `%${searchQuery.trim()}%`)
      }

      const { data: bloodBanks, error: bloodBankError } = await bloodBankQuery
      
      if (bloodBankError) {
        handleSupabaseError(bloodBankError, 'search blood banks')
        return
      }

      if (!bloodBanks || bloodBanks.length === 0) {
        setResults([])
        toast.error('No blood banks found matching your criteria')
        return
      }

      const bloodBankIds = bloodBanks.map(bb => bb.id)

      // Build query for blood inventory
      let inventoryQuery = supabase
        .schema('bloodbank')
        .from('blood_inventory')
        .select(`
          id,
          blood_group,
          quantity,
          expiry_date,
          status,
          status,
          blood_bank:blood_bank_id (
            id,
            name,
            phone,
            email
          )
        `)
        .eq('status', 'available')
        .gt('quantity', 0)
        .gte('expiry_date', new Date().toISOString().split('T')[0])
        .in('blood_bank_id', bloodBankIds)

      // Apply blood type filter
      if (selectedBloodType) {
        inventoryQuery = inventoryQuery.eq('blood_group', selectedBloodType)
      }

      const { data: inventory, error: inventoryError } = await inventoryQuery

      if (inventoryError) {
        handleSupabaseError(inventoryError, 'search inventory')
        return
      }

      // Group inventory by blood bank
      const bloodBankMap = new Map<string, BloodBankResult>()

      inventory?.forEach((item: BloodInventory) => {
        if (!item.blood_bank) {
          console.warn('Inventory item missing blood bank data:', item)
          return
        }
        
        const bankId = item.blood_bank.id
        
        if (!bloodBankMap.has(bankId)) {
          bloodBankMap.set(bankId, {
            id: bankId,
            name: item.blood_bank.name,
            phone: item.blood_bank.phone,
            email: item.blood_bank.email,
            bloodTypes: [],
            totalUnits: 0
          })
        }

        const bank = bloodBankMap.get(bankId)!
        bank.bloodTypes.push({
          type: item.blood_group,
          quantity: item.quantity,
          expiry: item.expiry_date,
          inventoryId: item.id
        })
        bank.totalUnits += item.quantity
      })

      const searchResults = Array.from(bloodBankMap.values())
      
      // Sort results by total units available (descending)
      searchResults.sort((a, b) => b.totalUnits - a.totalUnits)
      
      setResults(searchResults)

      if (searchResults.length === 0) {
        toast.error('No blood banks found matching your criteria')
      } else {
        toast.success(`Found ${searchResults.length} blood bank(s) with available blood`)
      }

    } catch (error: any) {
      console.error('Search error:', error)
      const message = error instanceof Error ? error.message : 'Failed to search blood banks. Please try again.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleRequestBlood = (bloodBank: BloodBankResult) => {
    if (!user) {
      toast.error('Please login to request blood')
      return
    }
    setSelectedBloodBank(bloodBank)
    setShowRequestModal(true)
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

    if (diffDays <= 3) return { text: `${diffDays} days`, urgent: true }
    if (diffDays <= 7) return { text: `${diffDays} days`, urgent: false }
    return { text: date.toLocaleDateString(), urgent: false }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSelectedBloodType('')
    setLocation('')
    setHasSearched(false)
    setResults([])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
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
              className="p-4 bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-lg"
            >
              <BeakerIcon className="h-12 w-12 text-white" />
            </motion.div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent mb-4">
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
          <Card className="p-6 mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Search blood banks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                className="transition-all duration-200 focus:scale-105"
              />

              <Select
                options={BLOOD_TYPES}
                value={selectedBloodType}
                onChange={(e) => setSelectedBloodType(e.target.value)}
                className="w-full transition-all duration-200 focus:scale-105"
              />

              <Input
                placeholder="Location/City"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyPress={handleKeyPress}
                icon={<MapPinIcon className="h-5 w-5" />}
                className="transition-all duration-200 focus:scale-105"
              />

              <Button
                onClick={handleSearch}
                loading={loading}
                className="w-full transform transition-all duration-200 hover:scale-105 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
              >
                <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center py-12"
            >
              <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-gray-600 dark:text-gray-400">
                  Searching blood banks...
                </p>
              </div>
            </motion.div>
          ) : hasSearched ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.2 }}
            >
              {results.length > 0 ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                      Found {results.length} Blood Bank{results.length !== 1 ? 's' : ''}
                    </h2>
                    <Button variant="outline" onClick={clearSearch} size="sm">
                      Clear Search
                    </Button>
                  </div>

                  {results.map((result, index) => (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <BloodBankCard
                        bloodBank={result}
                        onRequestBlood={handleRequestBlood}
                        formatExpiryDate={formatExpiryDate}
                        getUrgencyColor={getUrgencyColor}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg max-w-md mx-auto">
                    <MagnifyingGlassIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No blood banks found
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      Try adjusting your search criteria or location.
                    </p>
                    <Button variant="outline" onClick={clearSearch}>
                      Clear Search
                    </Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="initial"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg max-w-md mx-auto">
                <BeakerIcon className="h-16 w-16 text-red-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Search for Blood Banks
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Enter your search criteria above to find blood banks and check availability.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Emergency Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <Card className="p-6 border-l-4 border-red-500 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full mr-4">
                <PhoneIcon className="h-6 w-6 text-red-600" />
              </div>
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

      {/* Blood Request Modal */}
      {showRequestModal && selectedBloodBank && (
        <BloodRequestModal
          bloodBank={selectedBloodBank}
          onClose={() => {
            setShowRequestModal(false)
            setSelectedBloodBank(null)
          }}
          onSuccess={() => {
            setShowRequestModal(false)
            setSelectedBloodBank(null)
            toast.success('Blood request submitted successfully!')
          }}
        />
      )}
    </div>
  )
}
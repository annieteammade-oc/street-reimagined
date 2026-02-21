'use client'

import { useEffect, useState } from 'react'
import { AdminAuth } from '@/lib/admin-auth'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
  Users, Mail, MapPin, Smartphone, Monitor, Tablet, 
  Calendar, Activity, Filter, Download, Search, Eye,
  Globe, Clock, BarChart3, ChevronRight
} from 'lucide-react'

interface UserSession {
  id: string
  created_at: string
  last_active: string
  user_email?: string
  user_name?: string
  transformations_count: number
  successful_transformations: number
  device_type?: string
  browser_name?: string
  city?: string
  country?: string
  latest_request?: string
  latest_transformation?: string
}

interface DetailedUser extends UserSession {
  transformations: Array<{
    id: string
    created_at: string
    user_request: string
    categories: string[]
    status: string
    location_name?: string
  }>
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserSession[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserSession[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDevice, setFilterDevice] = useState('all')
  const [filterCountry, setFilterCountry] = useState('all')
  const [selectedUser, setSelectedUser] = useState<DetailedUser | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!AdminAuth.isAuthenticated()) {
      router.push('/admin/login')
      return
    }
    loadUsers()
  }, [router])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, filterDevice, filterCountry])

  const loadUsers = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('user_overview')
        .select('*')
        .order('last_active', { ascending: false })
      
      if (error) throw error
      
      setUsers(data || [])
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = users

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        (user.user_email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.user_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.city?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.country?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.latest_request?.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Device filter
    if (filterDevice !== 'all') {
      filtered = filtered.filter(user => user.device_type === filterDevice)
    }

    // Country filter
    if (filterCountry !== 'all') {
      filtered = filtered.filter(user => user.country === filterCountry)
    }

    setFilteredUsers(filtered)
  }

  const loadUserDetails = async (userId: string) => {
    try {
      // Get user session details
      const { data: sessionData, error: sessionError } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('id', userId)
        .single()

      if (sessionError) throw sessionError

      // Get user's transformations
      const { data: transformationData, error: transformationError } = await supabase
        .from('transformations')
        .select('id, created_at, user_request, categories, status, location_name')
        .eq('session_id', userId)
        .order('created_at', { ascending: false })

      if (transformationError) throw transformationError

      setSelectedUser({
        ...sessionData,
        transformations: transformationData || []
      })
      setShowDetails(true)
    } catch (error) {
      console.error('Error loading user details:', error)
    }
  }

  const exportUsersCSV = () => {
    const csvData = filteredUsers.map(user => ({
      'Session ID': user.id,
      'Email': user.user_email || '',
      'Name': user.user_name || '',
      'First Visit': new Date(user.created_at).toLocaleDateString('nl-NL'),
      'Last Active': new Date(user.last_active).toLocaleDateString('nl-NL'),
      'Transformations': user.transformations_count,
      'Successful': user.successful_transformations,
      'Device': user.device_type || '',
      'Browser': user.browser_name || '',
      'City': user.city || '',
      'Country': user.country || '',
      'Latest Request': user.latest_request || ''
    }))

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `street-reimagined-users-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const uniqueCountries = [...new Set(users.map(u => u.country).filter(Boolean))].sort()
  const uniqueDevices = [...new Set(users.map(u => u.device_type).filter(Boolean))].sort()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Gebruikers laden...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gebruikers Beheer</h1>
              <p className="text-gray-600 mt-1">{users.length} actieve gebruikers • {filteredUsers.length} gefilterd</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={exportUsersCSV}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Zoek op email, naam, locatie of verzoek..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            {/* Device Filter */}
            <div>
              <select
                value={filterDevice}
                onChange={(e) => setFilterDevice(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Alle apparaten</option>
                {uniqueDevices.map(device => (
                  <option key={device} value={device}>{device}</option>
                ))}
              </select>
            </div>

            {/* Country Filter */}
            <div>
              <select
                value={filterCountry}
                onChange={(e) => setFilterCountry(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Alle landen</option>
                {uniqueCountries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Gebruiker</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Activiteit</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Locatie</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Apparaat</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Laatste Verzoek</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Acties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => {
                  const DeviceIcon = user.device_type === 'mobile' ? Smartphone : 
                                    user.device_type === 'tablet' ? Tablet : Monitor
                  
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {user.user_name || 'Anoniem'}
                            </div>
                            {user.user_email && (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Mail className="w-3 h-3" />
                                <span>{user.user_email}</span>
                              </div>
                            )}
                            <div className="text-xs text-gray-500">
                              ID: {user.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium">
                              {user.transformations_count} transformaties
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {user.successful_transformations} succesvol
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>
                              {new Date(user.last_active).toLocaleDateString('nl-NL')}
                            </span>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        {user.city || user.country ? (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>
                              {[user.city, user.country].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Onbekend</span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <DeviceIcon className="w-4 h-4 text-gray-600" />
                          <span className="text-sm text-gray-600 capitalize">
                            {user.device_type || 'Onbekend'}
                          </span>
                        </div>
                        {user.browser_name && (
                          <div className="text-xs text-gray-500 mt-1">
                            {user.browser_name}
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4">
                        {user.latest_request ? (
                          <div className="max-w-xs">
                            <div className="text-sm text-gray-900 truncate">
                              {user.latest_request}
                            </div>
                            {user.latest_transformation && (
                              <div className="text-xs text-gray-500">
                                {new Date(user.latest_transformation).toLocaleDateString('nl-NL')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Geen verzoeken</span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4">
                        <button
                          onClick={() => loadUserDetails(user.id)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Details</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Geen gebruikers gevonden</h3>
              <p className="text-gray-600">Probeer je zoekfilters aan te passen.</p>
            </div>
          )}
        </div>
      </div>

      {/* User Details Modal */}
      {showDetails && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Gebruiker Details</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* User Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Gebruiker Informatie</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Naam:</strong> {selectedUser.user_name || 'Niet opgegeven'}</div>
                    <div><strong>Email:</strong> {selectedUser.user_email || 'Niet opgegeven'}</div>
                    <div><strong>Eerste bezoek:</strong> {new Date(selectedUser.created_at).toLocaleString('nl-NL')}</div>
                    <div><strong>Laatst actief:</strong> {new Date(selectedUser.last_active).toLocaleString('nl-NL')}</div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Technische Info</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Apparaat:</strong> {selectedUser.device_type || 'Onbekend'}</div>
                    <div><strong>Browser:</strong> {selectedUser.browser_name || 'Onbekend'}</div>
                    <div><strong>Locatie:</strong> {[selectedUser.city, selectedUser.country].filter(Boolean).join(', ') || 'Onbekend'}</div>
                    <div><strong>Transformaties:</strong> {selectedUser.transformations_count} ({selectedUser.successful_transformations} succesvol)</div>
                  </div>
                </div>
              </div>
              
              {/* Transformations */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Transformatie Geschiedenis</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {selectedUser.transformations.map((transformation) => (
                    <div key={transformation.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 mb-1">
                            {transformation.user_request}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(transformation.created_at).toLocaleString('nl-NL')}</span>
                            {transformation.location_name && (
                              <>
                                <span>•</span>
                                <MapPin className="w-4 h-4" />
                                <span>{transformation.location_name}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          transformation.status === 'completed' ? 'bg-green-100 text-green-800' :
                          transformation.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {transformation.status}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {transformation.categories.map((category) => (
                          <span key={category} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded capitalize">
                            {category}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
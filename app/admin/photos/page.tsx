'use client'

import { useEffect, useState } from 'react'
import { AdminAuth } from '@/lib/admin-auth'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
  Camera, Download, Eye, MapPin, Calendar, User, Tag,
  Filter, Search, Grid, List, ArrowUpDown, BarChart3,
  ExternalLink, Clock, Smartphone, Monitor, Tablet
} from 'lucide-react'
import Image from 'next/image'

interface PhotoTransformation {
  id: string
  created_at: string
  original_image_url?: string
  transformed_image_url?: string
  user_request: string
  categories: string[]
  location_name?: string
  user_email?: string
  user_name?: string
  device_type?: string
  processing_time_ms?: number
  status: string
  downloaded: boolean
  download_count: number
  ai_model: string
  session_id: string
}

export default function AdminPhotosPage() {
  const [photos, setPhotos] = useState<PhotoTransformation[]>([])
  const [filteredPhotos, setFilteredPhotos] = useState<PhotoTransformation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoTransformation | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!AdminAuth.isAuthenticated()) {
      router.push('/admin/login')
      return
    }
    loadPhotos()
  }, [router])

  useEffect(() => {
    filterAndSortPhotos()
  }, [photos, searchTerm, filterStatus, filterCategory, sortBy, sortOrder])

  const loadPhotos = async () => {
    try {
      setLoading(true)
      
      // Try Supabase first
      try {
        const { data, error } = await supabase
          .from('transformations')
          .select(`
            id, created_at, original_image_url, transformed_image_url,
            user_request, categories, location_name, user_email, user_name,
            device_type, processing_time_ms, status, downloaded, download_count,
            ai_model, session_id
          `)
          .order('created_at', { ascending: false })
          .limit(100) // Load first 100 for performance
        
        if (!error && data) {
          setPhotos(data)
          return
        }
      } catch (supabaseError) {
        console.warn('Supabase not available, using demo data:', supabaseError)
      }
      
      // Fallback to empty state
      setPhotos([])
    } catch (error) {
      console.error('Error loading photos:', error)
      setPhotos([])
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortPhotos = () => {
    let filtered = photos

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(photo =>
        photo.user_request.toLowerCase().includes(searchTerm.toLowerCase()) ||
        photo.location_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        photo.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        photo.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        photo.categories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(photo => photo.status === filterStatus)
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(photo => photo.categories.includes(filterCategory))
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any, bVal: any

      switch (sortBy) {
        case 'created_at':
          aVal = new Date(a.created_at).getTime()
          bVal = new Date(b.created_at).getTime()
          break
        case 'user_request':
          aVal = a.user_request.toLowerCase()
          bVal = b.user_request.toLowerCase()
          break
        case 'processing_time_ms':
          aVal = a.processing_time_ms || 0
          bVal = b.processing_time_ms || 0
          break
        case 'download_count':
          aVal = a.download_count
          bVal = b.download_count
          break
        default:
          aVal = a.created_at
          bVal = b.created_at
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

    setFilteredPhotos(filtered)
  }

  const downloadPhoto = async (photo: PhotoTransformation, type: 'original' | 'transformed') => {
    const url = type === 'original' ? photo.original_image_url : photo.transformed_image_url
    if (!url) return

    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `street-reimagined-${type}-${photo.id.slice(0, 8)}.jpg`
      a.click()
      
      URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const exportPhotosCSV = () => {
    const csvData = filteredPhotos.map(photo => ({
      'ID': photo.id,
      'Created': new Date(photo.created_at).toLocaleString('nl-NL'),
      'User Request': photo.user_request,
      'Categories': photo.categories.join('; '),
      'Location': photo.location_name || '',
      'User Email': photo.user_email || '',
      'User Name': photo.user_name || '',
      'Device': photo.device_type || '',
      'Processing Time (ms)': photo.processing_time_ms || '',
      'Status': photo.status,
      'Downloads': photo.download_count,
      'AI Model': photo.ai_model,
      'Has Original': photo.original_image_url ? 'Yes' : 'No',
      'Has Transformed': photo.transformed_image_url ? 'Yes' : 'No'
    }))

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `street-reimagined-photos-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const allCategories = [...new Set(photos.flatMap(p => p.categories))].sort()
  const allStatuses = [...new Set(photos.map(p => p.status))].sort()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Foto's laden...</span>
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
              <h1 className="text-3xl font-bold text-gray-900">Foto Galerij</h1>
              <p className="text-gray-600 mt-1">{photos.length} transformaties • {filteredPhotos.length} getoond</p>
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
                onClick={exportPhotosCSV}
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
        {/* Filters and Controls */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Zoek in verzoeken, locaties, gebruikers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            {/* Filters */}
            <div className="flex gap-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Alle statuses</option>
                {allStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Alle categorieën</option>
                {allCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sort and View Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="created_at">Datum</option>
                <option value="user_request">Verzoek</option>
                <option value="processing_time_ms">Verwerkingstijd</option>
                <option value="download_count">Downloads</option>
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Photos Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPhotos.map((photo) => {
              const DeviceIcon = photo.device_type === 'mobile' ? Smartphone : 
                                 photo.device_type === 'tablet' ? Tablet : Monitor
              
              return (
                <div key={photo.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  {/* Image Preview */}
                  <div className="aspect-video bg-gray-100 relative">
                    {photo.transformed_image_url ? (
                      <Image
                        src={photo.transformed_image_url}
                        alt="Transformed"
                        fill
                        className="object-cover"
                      />
                    ) : photo.original_image_url ? (
                      <Image
                        src={photo.original_image_url}
                        alt="Original"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <Camera className="w-12 h-12" />
                      </div>
                    )}
                    
                    <div className="absolute top-2 right-2 flex gap-1">
                      {photo.original_image_url && (
                        <button
                          onClick={() => downloadPhoto(photo, 'original')}
                          className="p-1 bg-black bg-opacity-50 text-white rounded text-xs hover:bg-opacity-70"
                          title="Download origineel"
                        >
                          O
                        </button>
                      )}
                      {photo.transformed_image_url && (
                        <button
                          onClick={() => downloadPhoto(photo, 'transformed')}
                          className="p-1 bg-black bg-opacity-50 text-white rounded text-xs hover:bg-opacity-70"
                          title="Download getransformeerd"
                        >
                          T
                        </button>
                      )}
                    </div>

                    <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium ${
                      photo.status === 'completed' ? 'bg-green-100 text-green-800' :
                      photo.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {photo.status}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="font-medium text-gray-900 mb-2 line-clamp-2">
                      {photo.user_request}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(photo.created_at).toLocaleDateString('nl-NL')}</span>
                      <DeviceIcon className="w-3 h-3 ml-2" />
                    </div>

                    {photo.location_name && (
                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{photo.location_name}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1 mb-3">
                      {photo.categories.slice(0, 3).map((category) => (
                        <span key={category} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {category}
                        </span>
                      ))}
                      {photo.categories.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          +{photo.categories.length - 3}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Download className="w-3 h-3" />
                        <span>{photo.download_count}</span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedPhoto(photo)
                          setShowDetails(true)
                        }}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Details</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          // List View
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Preview</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Verzoek</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Details</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Acties</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPhotos.map((photo) => {
                    const DeviceIcon = photo.device_type === 'mobile' ? Smartphone : 
                                       photo.device_type === 'tablet' ? Tablet : Monitor
                    
                    return (
                      <tr key={photo.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="w-16 h-12 bg-gray-100 rounded relative overflow-hidden">
                            {(photo.transformed_image_url || photo.original_image_url) && (
                              <Image
                                src={photo.transformed_image_url || photo.original_image_url || ''}
                                alt="Preview"
                                fill
                                className="object-cover"
                              />
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            <div className="font-medium text-gray-900 truncate">
                              {photo.user_request}
                            </div>
                            <div className="flex gap-1 mt-1">
                              {photo.categories.slice(0, 2).map((category) => (
                                <span key={category} className="px-1 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                                  {category}
                                </span>
                              ))}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(photo.created_at).toLocaleDateString('nl-NL')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DeviceIcon className="w-3 h-3" />
                              <span>{photo.device_type}</span>
                            </div>
                            {photo.location_name && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate">{photo.location_name}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            photo.status === 'completed' ? 'bg-green-100 text-green-800' :
                            photo.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {photo.status}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedPhoto(photo)
                                setShowDetails(true)
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredPhotos.length === 0 && (
          <div className="text-center py-12">
            <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {photos.length === 0 ? 'Nog geen foto transformaties' : 'Geen foto\'s gevonden'}
            </h3>
            <p className="text-gray-600">
              {photos.length === 0 
                ? 'Zodra gebruikers foto\'s gaan transformeren verschijnen hier alle originele en bewerkte foto\'s.' 
                : 'Probeer je zoekfilters aan te passen.'}
            </p>
            {photos.length === 0 && (
              <div className="mt-4 text-sm text-blue-600">
                <strong>Demo Mode:</strong> Foto galerij is klaar voor gebruik zodra er data is
              </div>
            )}
          </div>
        )}
      </div>

      {/* Photo Details Modal */}
      {showDetails && selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Transformatie Details</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Images */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {selectedPhoto.original_image_url && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Originele Foto</h3>
                    <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={selectedPhoto.original_image_url}
                        alt="Original"
                        fill
                        className="object-cover"
                      />
                      <button
                        onClick={() => downloadPhoto(selectedPhoto, 'original')}
                        className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
                
                {selectedPhoto.transformed_image_url && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Getransformeerde Foto</h3>
                    <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={selectedPhoto.transformed_image_url}
                        alt="Transformed"
                        fill
                        className="object-cover"
                      />
                      <button
                        onClick={() => downloadPhoto(selectedPhoto, 'transformed')}
                        className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Transformatie Info</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Verzoek:</strong> {selectedPhoto.user_request}</div>
                    <div><strong>Categorieën:</strong> {selectedPhoto.categories.join(', ')}</div>
                    <div><strong>Datum:</strong> {new Date(selectedPhoto.created_at).toLocaleString('nl-NL')}</div>
                    <div><strong>Status:</strong> {selectedPhoto.status}</div>
                    <div><strong>AI Model:</strong> {selectedPhoto.ai_model}</div>
                    {selectedPhoto.processing_time_ms && (
                      <div><strong>Verwerkingstijd:</strong> {selectedPhoto.processing_time_ms}ms</div>
                    )}
                    <div><strong>Downloads:</strong> {selectedPhoto.download_count}</div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Gebruiker Info</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Naam:</strong> {selectedPhoto.user_name || 'Niet opgegeven'}</div>
                    <div><strong>Email:</strong> {selectedPhoto.user_email || 'Niet opgegeven'}</div>
                    <div><strong>Locatie:</strong> {selectedPhoto.location_name || 'Onbekend'}</div>
                    <div><strong>Apparaat:</strong> {selectedPhoto.device_type || 'Onbekend'}</div>
                    <div><strong>Session ID:</strong> {selectedPhoto.session_id.slice(0, 8)}...</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
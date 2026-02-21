'use client'

import { useEffect, useState } from 'react'
import { AdminAuth } from '@/lib/admin-auth'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
  BarChart3, Users, Camera, Download, MapPin, Clock, 
  TrendingUp, Activity, Globe, Smartphone, Monitor, Tablet,
  TreePine, Bike, Users as PlayIcon, Zap, Car, Sparkles
} from 'lucide-react'

interface DashboardStats {
  totalTransformations: number
  totalUsers: number
  totalWithEmail: number
  transformationsToday: number
  transformationsThisWeek: number
  transformationsThisMonth: number
  successRate: number
  avgProcessingTime: number
  topCategory: string
}

interface CategoryData {
  name: string
  count: number
  percentage: number
  color: string
  icon: any
}

interface RecentTransformation {
  id: string
  created_at: string
  user_request: string
  categories: string[]
  location_name?: string
  device_type?: string
  status: string
}

const CATEGORY_ICONS = {
  groen: TreePine,
  fiets: Bike,
  speel: PlayIcon,
  social: Zap,
  minder_auto: Car,
  wandel: Users,
  sport: Activity,
  cultuur: Sparkles,
  other: Sparkles
}

const CATEGORY_COLORS = {
  groen: '#10B981',
  fiets: '#3B82F6', 
  speel: '#F59E0B',
  social: '#8B5CF6',
  minder_auto: '#EF4444',
  wandel: '#06B6D4',
  sport: '#F97316',
  cultuur: '#EC4899',
  other: '#6B7280'
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [categories, setCategories] = useState<CategoryData[]>([])
  const [recentTransformations, setRecentTransformations] = useState<RecentTransformation[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check authentication
    if (!AdminAuth.isAuthenticated()) {
      router.push('/admin/login')
      return
    }

    loadDashboardData()
  }, [router])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load main stats
      const { data: statsData, error: statsError } = await supabase.rpc('get_admin_stats')
      if (statsError) throw statsError
      
      // Load category breakdown for the last 30 days
      const { data: categoryData, error: categoryError } = await supabase
        .from('transformations')
        .select('categories')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .eq('status', 'completed')
      
      if (categoryError) throw categoryError

      // Process category data
      const categoryCount: Record<string, number> = {}
      let totalCategories = 0
      
      categoryData.forEach(item => {
        item.categories?.forEach((cat: string) => {
          categoryCount[cat] = (categoryCount[cat] || 0) + 1
          totalCategories++
        })
      })

      const processedCategories: CategoryData[] = Object.entries(categoryCount)
        .map(([name, count]) => ({
          name,
          count,
          percentage: Math.round((count / totalCategories) * 100),
          color: CATEGORY_COLORS[name as keyof typeof CATEGORY_COLORS] || '#6B7280',
          icon: CATEGORY_ICONS[name as keyof typeof CATEGORY_ICONS] || Sparkles
        }))
        .sort((a, b) => b.count - a.count)

      // Load recent transformations
      const { data: recentData, error: recentError } = await supabase
        .from('transformations')
        .select('id, created_at, user_request, categories, location_name, device_type, status')
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (recentError) throw recentError

      setStats(statsData)
      setCategories(processedCategories)
      setRecentTransformations(recentData || [])
      
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await loadDashboardData()
    setRefreshing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Dashboard laden...</span>
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
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">Street Reimagined Analytics & Beheer</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={refreshData}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <Activity className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Verversen</span>
              </button>
              <div className="text-sm text-gray-500">
                Laatste update: {new Date().toLocaleTimeString('nl-NL')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Key Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Totaal Transformaties</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalTransformations || 0}</p>
                <p className="text-sm text-gray-500">+{stats?.transformationsToday || 0} vandaag</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Camera className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Actieve Gebruikers</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
                <p className="text-sm text-gray-500">{stats?.totalWithEmail || 0} met email</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Succes Ratio</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.successRate || 0}%</p>
                <p className="text-sm text-gray-500">Deze week</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gem. Verwerkingstijd</p>
                <p className="text-3xl font-bold text-gray-900">{Math.round(stats?.avgProcessingTime || 0)}ms</p>
                <p className="text-sm text-gray-500">AI verwerking</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Category Distribution */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Transformatie Categorieën</h3>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
            
            <div className="space-y-4">
              {categories.slice(0, 6).map((category) => {
                const IconComponent = category.icon
                return (
                  <div key={category.name} className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <IconComponent className="w-4 h-4" style={{ color: category.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium capitalize text-gray-900">
                          {category.name}
                        </span>
                        <span className="text-sm text-gray-600">
                          {category.count} ({category.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full" 
                          style={{ 
                            width: `${category.percentage}%`, 
                            backgroundColor: category.color 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recente Activiteit</h3>
              <Activity className="w-5 h-5 text-gray-400" />
            </div>
            
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {recentTransformations.map((transformation) => (
                <div key={transformation.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    transformation.status === 'completed' ? 'bg-green-500' : 
                    transformation.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {transformation.user_request}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {transformation.categories.map((cat) => {
                        const IconComponent = CATEGORY_ICONS[cat as keyof typeof CATEGORY_ICONS] || Sparkles
                        return (
                          <div key={cat} className="flex items-center gap-1">
                            <IconComponent className="w-3 h-3 text-gray-500" />
                            <span className="text-xs text-gray-500 capitalize">{cat}</span>
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {new Date(transformation.created_at).toLocaleString('nl-NL')}
                      </span>
                      {transformation.location_name && (
                        <span className="text-xs text-gray-500">• {transformation.location_name}</span>
                      )}
                      {transformation.device_type && (
                        <span className="text-xs text-gray-500">• {transformation.device_type}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <button
            onClick={() => router.push('/admin/users')}
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Gebruikers</h3>
                <p className="text-sm text-gray-600">Beheer gebruikerslijst</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push('/admin/photos')}
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Camera className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Foto Galerij</h3>
                <p className="text-sm text-gray-600">Bekijk alle transformaties</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push('/admin/export')}
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Download className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Data Export</h3>
                <p className="text-sm text-gray-600">Download CSV rapporten</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push('/admin/settings')}
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Globe className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Instellingen</h3>
                <p className="text-sm text-gray-600">Admin beheer & config</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
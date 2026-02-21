'use client'

import { useEffect, useState } from 'react'
import { TransformationDB, Transformation } from '@/lib/supabase'
import { TreePine, Bike, Users, Zap, Car, Sparkles } from 'lucide-react'

interface AnalyticsData {
  totalTransformations: number
  categoryCounts: Record<string, number>
  recentRequests: string[]
}

const CATEGORY_ICONS = {
  groen: TreePine,
  fiets: Bike, 
  speel: Users,
  social: Zap,
  minder_auto: Car,
  other: Sparkles
}

const CATEGORY_COLORS = {
  groen: 'text-green-600 bg-green-100',
  fiets: 'text-blue-600 bg-blue-100',
  speel: 'text-orange-600 bg-orange-100', 
  social: 'text-purple-600 bg-purple-100',
  minder_auto: 'text-red-600 bg-red-100',
  other: 'text-gray-600 bg-gray-100'
}

const CATEGORY_LABELS = {
  groen: 'Meer Groen',
  fiets: 'Fietsvriendelijk',
  speel: 'Kindvriendelijk',
  social: 'Ontmoeting', 
  minder_auto: 'Minder Auto\'s',
  other: 'Overig'
}

export default function SupabaseAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [recentTransformations, setRecentTransformations] = useState<Transformation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      
      // Load analytics and recent transformations in parallel
      const [analyticsData, recentData] = await Promise.all([
        TransformationDB.getAnalytics(),
        TransformationDB.getRecentTransformations(6)
      ])
      
      setAnalytics(analyticsData)
      setRecentTransformations(recentData)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!analytics || analytics.totalTransformations === 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-gray-600 text-sm">Nog geen transformaties in de database.</p>
      </div>
    )
  }

  const topCategory = Object.entries(analytics.categoryCounts)
    .sort(([,a], [,b]) => b - a)[0]

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">📊 Community Insights</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{analytics.totalTransformations}</div>
            <div className="text-xs text-gray-600">Totaal</div>
          </div>
          
          {Object.entries(analytics.categoryCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([category, count]) => {
              const Icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || Sparkles
              const colorClass = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || 'text-gray-600 bg-gray-100'
              const label = CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category
              
              return (
                <div key={category} className="text-center">
                  <div className={`w-8 h-8 rounded-lg ${colorClass} flex items-center justify-center mx-auto mb-1`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-lg font-bold text-gray-900">{count}</div>
                  <div className="text-xs text-gray-600">{label}</div>
                </div>
              )
            })
          }
        </div>

        {topCategory && (
          <div className="border-t pt-4">
            <p className="text-sm text-gray-700">
              🏆 Populairste transformatie: <strong>{CATEGORY_LABELS[topCategory[0] as keyof typeof CATEGORY_LABELS] || topCategory[0]}</strong> ({Math.round(topCategory[1] / analytics.totalTransformations * 100)}%)
            </p>
          </div>
        )}
      </div>

      {/* Recent Requests */}
      {analytics.recentRequests.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h4 className="font-semibold text-gray-900 mb-3">💭 Recente Wensen</h4>
          <div className="space-y-2">
            {analytics.recentRequests.slice(0, 5).map((request, index) => (
              <div key={index} className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                "{request}"
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transformations Gallery */}
      {recentTransformations.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h4 className="font-semibold text-gray-900 mb-3">🖼️ Recente Transformaties</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {recentTransformations.slice(0, 6).map((transformation) => (
              <div key={transformation.id} className="bg-gray-100 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">
                  {new Date(transformation.created_at).toLocaleDateString('nl-NL')}
                </div>
                <div className="text-sm font-medium text-gray-900 mb-1 truncate">
                  {transformation.user_request}
                </div>
                <div className="flex flex-wrap gap-1">
                  {transformation.categories.map((category) => {
                    const Icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || Sparkles
                    const colorClass = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || 'text-gray-600 bg-gray-100'
                    
                    return (
                      <div key={category} className={`w-4 h-4 rounded ${colorClass} flex items-center justify-center`}>
                        <Icon className="w-2 h-2" />
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={loadAnalytics}
          disabled={loading}
          className="text-sm text-gray-600 hover:text-gray-900 underline"
        >
          {loading ? 'Laden...' : 'Vernieuwen'}
        </button>
      </div>
    </div>
  )
}
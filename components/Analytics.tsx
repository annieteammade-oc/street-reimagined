'use client'

// Simple analytics for tracking transformation requests
// This helps understand what people want most in their streets

interface TransformationData {
  request: string
  categories: string[]
  location?: { lat: number; lng: number } | null
  timestamp: string
}

interface CategoryCounts {
  groen: number
  fiets: number
  speel: number
  social: number
  minder_auto: number
  other: number
}

class AnalyticsService {
  private readonly STORAGE_KEY = 'street-reimagined-analytics'
  
  extractCategories(request: string): string[] {
    const categories: string[] = []
    const lowercaseRequest = request.toLowerCase()

    // Define category patterns
    const patterns = {
      groen: /\b(groen|boom|bomen|planten?|tuin|park|natuur|bloemen?)\b/g,
      fiets: /\b(fiets|fietspad|bike|wielr|cycling|fietsenstalling)\b/g,
      speel: /\b(speel|kind|kinderen|playground|speeltuin|spelen|jeugd)\b/g,
      social: /\b(terras|cafe|zitten|bankje?|ontmoet|social|gezellig|samen)\b/g,
      minder_auto: /\b(minder auto|geen auto|parkeren? weg|minder parkeer|auto weg)\b/g
    }

    // Check each pattern
    Object.entries(patterns).forEach(([category, pattern]) => {
      if (pattern.test(lowercaseRequest)) {
        categories.push(category)
      }
    })

    // If no specific categories found, mark as 'other'
    if (categories.length === 0) {
      categories.push('other')
    }

    return categories
  }

  async trackTransformation(data: TransformationData): Promise<void> {
    try {
      // Store locally (in real app, this would go to a database)
      const stored = this.getStoredData()
      stored.push(data)
      
      // Keep only last 100 entries to avoid storage bloat
      if (stored.length > 100) {
        stored.splice(0, stored.length - 100)
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stored))
      
      // Log for debugging (remove in production)
      console.log('Transformation tracked:', {
        categories: data.categories,
        hasLocation: !!data.location,
        timestamp: data.timestamp
      })
      
    } catch (error) {
      console.error('Analytics tracking failed:', error)
      // Fail silently - analytics shouldn't break the app
    }
  }

  getStoredData(): TransformationData[] {
    try {
      if (typeof window === 'undefined') return []
      
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  getCategoryStats(): CategoryCounts & { total: number } {
    const data = this.getStoredData()
    const stats: CategoryCounts = {
      groen: 0,
      fiets: 0,
      speel: 0,
      social: 0,
      minder_auto: 0,
      other: 0
    }

    data.forEach(item => {
      item.categories.forEach(category => {
        if (category in stats) {
          stats[category as keyof CategoryCounts]++
        }
      })
    })

    return {
      ...stats,
      total: data.length
    }
  }

  getRecentRequests(limit: number = 10): string[] {
    const data = this.getStoredData()
    return data
      .slice(-limit)
      .map(item => item.request)
      .reverse()
  }

  // Get anonymized location data (city level only)
  async getLocationInsights(): Promise<{ hasLocation: number; noLocation: number }> {
    const data = this.getStoredData()
    let hasLocation = 0
    let noLocation = 0

    data.forEach(item => {
      if (item.location) {
        hasLocation++
      } else {
        noLocation++
      }
    })

    return { hasLocation, noLocation }
  }

  // Export data for business insights (anonymized)
  exportInsights(): {
    categoryStats: CategoryCounts & { total: number }
    locationCoverage: { hasLocation: number; noLocation: number }
    recentTrends: string[]
    summary: string
  } {
    const categoryStats = this.getCategoryStats()
    const topCategory = Object.entries(categoryStats)
      .filter(([key]) => key !== 'total')
      .sort(([,a], [,b]) => b - a)[0]

    return {
      categoryStats,
      locationCoverage: { hasLocation: 0, noLocation: 0 }, // Will be async in real implementation
      recentTrends: this.getRecentRequests(5),
      summary: `Van ${categoryStats.total} transformaties wilde ${Math.round(categoryStats[topCategory[0] as keyof CategoryCounts] / categoryStats.total * 100)}% meer ${topCategory[0]}.`
    }
  }

  // Clear data (GDPR compliance)
  clearData(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY)
      console.log('Analytics data cleared')
    } catch (error) {
      console.error('Failed to clear analytics data:', error)
    }
  }
}

// Export singleton instance
const Analytics = new AnalyticsService()
export default Analytics

// React component for displaying insights (admin/debug)
export function AnalyticsDisplay() {
  const insights = Analytics.exportInsights()
  
  if (insights.categoryStats.total === 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-gray-600 text-sm">Nog geen transformaties getrackt.</p>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-4">📊 Community Insights</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
        {Object.entries(insights.categoryStats)
          .filter(([key]) => key !== 'total')
          .map(([category, count]) => (
            <div key={category} className="text-center">
              <div className="text-2xl font-bold text-primary">{count}</div>
              <div className="text-xs text-gray-600 capitalize">{category}</div>
            </div>
          ))
        }
      </div>

      <div className="border-t pt-4">
        <p className="text-sm text-gray-700">{insights.summary}</p>
        <p className="text-xs text-gray-500 mt-2">
          Totaal transformaties: {insights.categoryStats.total}
        </p>
      </div>
    </div>
  )
}
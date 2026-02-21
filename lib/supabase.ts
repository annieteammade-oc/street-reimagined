import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Transformation {
  id: string
  created_at: string
  original_image_url?: string
  transformed_image_url?: string
  user_request: string
  categories: string[]
  latitude?: number
  longitude?: number
  location_name?: string
  ai_model: string
  processing_time_ms?: number
  session_id?: string
  status: 'processing' | 'completed' | 'failed'
}

export interface UserSession {
  id: string
  created_at: string
  last_active: string
  transformations_count: number
  location_name?: string
  device_info?: any
}

export interface Category {
  id: string
  name: string
  description?: string
  icon?: string
  color?: string
  created_at: string
}

// Database functions
export class TransformationDB {
  // Save transformation to database
  static async saveTransformation({
    originalImageUrl,
    transformedImageUrl, 
    userRequest,
    categories,
    latitude,
    longitude,
    locationName,
    aiModel = 'gemini-3-pro-image-preview',
    processingTimeMs,
    sessionId
  }: {
    originalImageUrl?: string
    transformedImageUrl?: string
    userRequest: string
    categories: string[]
    latitude?: number
    longitude?: number
    locationName?: string
    aiModel?: string
    processingTimeMs?: number
    sessionId?: string
  }): Promise<Transformation | null> {
    try {
      const { data, error } = await supabase
        .from('transformations')
        .insert({
          original_image_url: originalImageUrl,
          transformed_image_url: transformedImageUrl,
          user_request: userRequest,
          categories,
          latitude,
          longitude,
          location_name: locationName,
          ai_model: aiModel,
          processing_time_ms: processingTimeMs,
          session_id: sessionId,
          status: 'completed'
        })
        .select()
        .single()

      if (error) {
        console.error('Error saving transformation:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Database error:', error)
      return null
    }
  }

  // Get recent transformations for gallery
  static async getRecentTransformations(limit: number = 10): Promise<Transformation[]> {
    try {
      const { data, error } = await supabase
        .from('transformations')
        .select('*')
        .eq('status', 'completed')
        .not('transformed_image_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching transformations:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Database error:', error)
      return []
    }
  }

  // Get analytics data
  static async getAnalytics(): Promise<{
    totalTransformations: number
    categoryCounts: Record<string, number>
    recentRequests: string[]
  }> {
    try {
      // Get total count
      const { count } = await supabase
        .from('transformations')
        .select('*', { count: 'exact', head: true })

      // Get category breakdown from last 30 days
      const { data: categoryData, error: categoryError } = await supabase
        .from('transformations')
        .select('categories')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      if (categoryError) {
        console.error('Category analytics error:', categoryError)
      }

      // Process category counts
      const categoryCounts: Record<string, number> = {}
      categoryData?.forEach(item => {
        item.categories?.forEach((category: string) => {
          categoryCounts[category] = (categoryCounts[category] || 0) + 1
        })
      })

      // Get recent unique requests
      const { data: requestData, error: requestError } = await supabase
        .from('transformations')
        .select('user_request')
        .order('created_at', { ascending: false })
        .limit(10)

      if (requestError) {
        console.error('Request analytics error:', requestError)
      }

      const recentRequests = [...new Set(requestData?.map(item => item.user_request) || [])]

      return {
        totalTransformations: count || 0,
        categoryCounts,
        recentRequests
      }
    } catch (error) {
      console.error('Analytics error:', error)
      return {
        totalTransformations: 0,
        categoryCounts: {},
        recentRequests: []
      }
    }
  }

  // Create or update user session
  static async upsertSession(sessionId: string, deviceInfo?: any): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .upsert({
          id: sessionId,
          last_active: new Date().toISOString(),
          device_info: deviceInfo
        }, {
          onConflict: 'id',
          ignoreDuplicates: false
        })
        .select()
        .single()

      if (error) {
        console.error('Session upsert error:', error)
        return sessionId
      }

      return data.id
    } catch (error) {
      console.error('Session error:', error)
      return sessionId
    }
  }

  // Increment transformation count for session
  static async incrementSessionCount(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_session_count', {
        session_id: sessionId
      })

      if (error) {
        console.error('Session count increment error:', error)
      }
    } catch (error) {
      console.error('Session count error:', error)
    }
  }
}

// Image upload utilities (for Supabase Storage if needed)
export class ImageStorage {
  static async uploadImage(file: File, path: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from('transformations')
        .upload(path, file)

      if (error) {
        console.error('Upload error:', error)
        return null
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('transformations')
        .getPublicUrl(data.path)

      return publicUrl
    } catch (error) {
      console.error('Upload error:', error)
      return null
    }
  }

  static async uploadBase64Image(base64: string, filename: string): Promise<string | null> {
    try {
      // Convert base64 to blob
      const response = await fetch(base64)
      const blob = await response.blob()
      
      const file = new File([blob], filename, { type: 'image/jpeg' })
      
      return await this.uploadImage(file, `images/${Date.now()}-${filename}`)
    } catch (error) {
      console.error('Base64 upload error:', error)
      return null
    }
  }
}
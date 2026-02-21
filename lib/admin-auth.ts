// Admin Authentication System - Works with or without Supabase
import { supabase } from './supabase'

export interface AdminUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'super_admin'
  last_login?: string
  active: boolean
}

export class AdminAuth {
  private static ADMIN_TOKEN_KEY = 'street_admin_token'
  
  // Hardcoded admins for when Supabase is not available
  private static FALLBACK_ADMINS = [
    {
      id: '1',
      email: 'dennis.teammade@gmail.com',
      name: 'Dennis Matthijs',
      password: 'teamMade2026',
      role: 'super_admin' as const,
      active: true
    },
    {
      id: '2', 
      email: 'admin@teammade.be',
      name: 'Admin User',
      password: 'admin123',
      role: 'admin' as const,
      active: true
    },
    {
      id: '3',
      email: 'test@example.com',
      name: 'Test Admin',
      password: 'test123',
      role: 'admin' as const,
      active: true
    }
  ]
  
  static async login(email: string, password: string): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    try {
      // Try Supabase first if available
      if (supabase) {
        try {
          const { data, error } = await supabase.rpc('authenticate_admin', {
            user_email: email,
            user_password: password
          })
          
          if (!error && data?.success) {
            const adminData = {
              ...data.user,
              loginTime: new Date().toISOString()
            }
            
            if (typeof window !== 'undefined') {
              localStorage.setItem(this.ADMIN_TOKEN_KEY, JSON.stringify(adminData))
            }
            
            return { success: true, user: data.user }
          }
        } catch (supabaseError) {
          console.warn('Supabase login failed, falling back to hardcoded auth:', supabaseError)
        }
      }
      
      // Fallback to hardcoded authentication
      const admin = this.FALLBACK_ADMINS.find(a => 
        a.email === email && a.password === password && a.active
      )
      
      if (admin) {
        const adminUser: AdminUser = {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          active: admin.active,
          last_login: new Date().toISOString()
        }
        
        const adminData = {
          ...adminUser,
          loginTime: new Date().toISOString()
        }
        
        if (typeof window !== 'undefined') {
          localStorage.setItem(this.ADMIN_TOKEN_KEY, JSON.stringify(adminData))
        }
        
        return { success: true, user: adminUser }
      } else {
        return { success: false, error: 'Invalid email or password' }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Login failed' }
    }
  }
  
  static logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.ADMIN_TOKEN_KEY)
      window.location.href = '/admin/login'
    }
  }
  
  static getCurrentAdmin(): AdminUser | null {
    if (typeof window === 'undefined') return null
    
    try {
      const stored = localStorage.getItem(this.ADMIN_TOKEN_KEY)
      if (!stored) return null
      
      const adminData = JSON.parse(stored)
      
      // Check if token is expired (24 hours)
      const loginTime = new Date(adminData.loginTime)
      const now = new Date()
      const hoursDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60)
      
      if (hoursDiff > 24) {
        this.logout()
        return null
      }
      
      return adminData
    } catch {
      return null
    }
  }
  
  static isAuthenticated(): boolean {
    return this.getCurrentAdmin() !== null
  }
  
  static requireAuth(): AdminUser {
    const admin = this.getCurrentAdmin()
    if (!admin) {
      if (typeof window !== 'undefined') {
        window.location.href = '/admin/login'
      }
      throw new Error('Authentication required')
    }
    return admin
  }
  
  static async addAdmin(email: string, name: string, password: string, role: 'admin' | 'super_admin' = 'admin'): Promise<boolean> {
    try {
      const currentAdmin = this.getCurrentAdmin()
      if (!currentAdmin || currentAdmin.role !== 'super_admin') {
        throw new Error('Unauthorized: Only super admins can add new admins')
      }
      
      // Try Supabase first
      if (supabase) {
        try {
          const { error } = await supabase
            .from('admin_users')
            .insert({
              email,
              name,
              password_hash: password, // In real app, hash this properly
              role,
              active: true
            })
          
          if (!error) return true
        } catch (supabaseError) {
          console.warn('Supabase add admin failed:', supabaseError)
        }
      }
      
      // For fallback mode, we can't actually add admins (hardcoded list)
      console.warn('Cannot add admins in fallback mode - hardcoded list only')
      return false
    } catch (error) {
      console.error('Add admin error:', error)
      return false
    }
  }
  
  static async getAllAdmins(): Promise<AdminUser[]> {
    try {
      // Try Supabase first
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('admin_users')
            .select('id, email, name, role, last_login, active')
            .order('created_at', { ascending: false })
          
          if (!error && data) {
            return data
          }
        } catch (supabaseError) {
          console.warn('Supabase get admins failed:', supabaseError)
        }
      }
      
      // Fallback to hardcoded list
      return this.FALLBACK_ADMINS.map(admin => ({
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        active: admin.active,
        last_login: undefined
      }))
    } catch (error) {
      console.error('Get admins error:', error)
      return []
    }
  }
  
  static async toggleAdminStatus(adminId: string, active: boolean): Promise<boolean> {
    try {
      const currentAdmin = this.getCurrentAdmin()
      if (!currentAdmin || currentAdmin.role !== 'super_admin') {
        throw new Error('Unauthorized')
      }
      
      // Try Supabase first
      if (supabase) {
        try {
          const { error } = await supabase
            .from('admin_users')
            .update({ active })
            .eq('id', adminId)
          
          if (!error) return true
        } catch (supabaseError) {
          console.warn('Supabase toggle admin failed:', supabaseError)
        }
      }
      
      // For fallback mode, we can't actually toggle (hardcoded list)
      console.warn('Cannot toggle admin status in fallback mode - hardcoded list only')
      return false
    } catch (error) {
      console.error('Toggle admin status error:', error)
      return false
    }
  }
}
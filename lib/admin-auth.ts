// Admin Authentication System
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
  
  static async login(email: string, password: string): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    try {
      // Call the authentication function in Supabase
      const { data, error } = await supabase.rpc('authenticate_admin', {
        user_email: email,
        user_password: password
      })
      
      if (error) {
        console.error('Auth error:', error)
        return { success: false, error: 'Authentication failed' }
      }
      
      if (data.success) {
        // Store admin session
        const adminData = {
          ...data.user,
          loginTime: new Date().toISOString()
        }
        
        localStorage.setItem(this.ADMIN_TOKEN_KEY, JSON.stringify(adminData))
        
        return { success: true, user: data.user }
      } else {
        return { success: false, error: data.error || 'Invalid credentials' }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Login failed' }
    }
  }
  
  static logout(): void {
    localStorage.removeItem(this.ADMIN_TOKEN_KEY)
    window.location.href = '/admin/login'
  }
  
  static getCurrentAdmin(): AdminUser | null {
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
      window.location.href = '/admin/login'
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
      
      const { error } = await supabase
        .from('admin_users')
        .insert({
          email,
          name,
          password_hash: await this.hashPassword(password),
          role,
          active: true
        })
      
      if (error) {
        console.error('Add admin error:', error)
        return false
      }
      
      return true
    } catch (error) {
      console.error('Add admin error:', error)
      return false
    }
  }
  
  private static async hashPassword(password: string): Promise<string> {
    // In a real app, this should be done server-side
    // For now, we'll let Supabase handle it with the crypt function
    return password // The SQL function will handle the actual hashing
  }
  
  static async getAllAdmins(): Promise<AdminUser[]> {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, email, name, role, last_login, active')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Get admins error:', error)
        return []
      }
      
      return data || []
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
      
      const { error } = await supabase
        .from('admin_users')
        .update({ active })
        .eq('id', adminId)
      
      return !error
    } catch (error) {
      console.error('Toggle admin status error:', error)
      return false
    }
  }
}
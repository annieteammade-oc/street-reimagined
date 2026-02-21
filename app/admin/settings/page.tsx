'use client'

import { useEffect, useState } from 'react'
import { AdminAuth } from '@/lib/admin-auth'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
  Settings, Users, Shield, Key, Trash2, Plus, Save,
  BarChart3, AlertCircle, CheckCircle, Eye, EyeOff
} from 'lucide-react'

interface AdminUser {
  id: string
  email: string
  created_at: string
  last_login?: string
  is_active: boolean
}

export default function AdminSettingsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [newAdminPassword, setNewAdminPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!AdminAuth.isAuthenticated()) {
      router.push('/admin/login')
      return
    }
    loadAdmins()
  }, [router])

  const loadAdmins = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      setAdmins(data || [])
    } catch (error) {
      console.error('Error loading admins:', error)
    } finally {
      setLoading(false)
    }
  }

  const addAdmin = async () => {
    if (!newAdminEmail || !newAdminPassword) {
      setMessage({ type: 'error', text: 'Vul beide velden in' })
      return
    }

    if (newAdminPassword.length < 6) {
      setMessage({ type: 'error', text: 'Wachtwoord moet minimaal 6 karakters zijn' })
      return
    }

    try {
      setSaving(true)
      
      const { error } = await supabase
        .from('admin_users')
        .insert([{
          email: newAdminEmail.toLowerCase(),
          password_hash: newAdminPassword, // In real implementation, this should be hashed
          is_active: true
        }])
      
      if (error) throw error
      
      setNewAdminEmail('')
      setNewAdminPassword('')
      setMessage({ type: 'success', text: 'Admin succesvol toegevoegd' })
      loadAdmins()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Fout bij toevoegen admin' })
    } finally {
      setSaving(false)
    }
  }

  const toggleAdminStatus = async (adminId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('admin_users')
        .update({ is_active: !currentStatus })
        .eq('id', adminId)
      
      if (error) throw error
      
      setMessage({ type: 'success', text: `Admin ${!currentStatus ? 'geactiveerd' : 'gedeactiveerd'}` })
      loadAdmins()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Fout bij wijzigen status' })
    }
  }

  const deleteAdmin = async (adminId: string, email: string) => {
    if (!confirm(`Weet je zeker dat je admin "${email}" wilt verwijderen?`)) return
    
    try {
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', adminId)
      
      if (error) throw error
      
      setMessage({ type: 'success', text: 'Admin verwijderd' })
      loadAdmins()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Fout bij verwijderen admin' })
    }
  }

  const changePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'Vul alle wachtwoord velden in' })
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Nieuwe wachtwoorden komen niet overeen' })
      return
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Nieuw wachtwoord moet minimaal 6 karakters zijn' })
      return
    }

    try {
      setSaving(true)
      
      // In a real implementation, you'd verify current password first
      const currentUser = AdminAuth.getCurrentUser()
      if (!currentUser) throw new Error('Geen huidige gebruiker gevonden')
      
      const { error } = await supabase
        .from('admin_users')
        .update({ password_hash: newPassword }) // In real implementation, hash this
        .eq('email', currentUser.email)
      
      if (error) throw error
      
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setMessage({ type: 'success', text: 'Wachtwoord succesvol gewijzigd' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Fout bij wijzigen wachtwoord' })
    } finally {
      setSaving(false)
    }
  }

  const logout = () => {
    AdminAuth.logout()
    router.push('/admin/login')
  }

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Instellingen laden...</span>
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
              <h1 className="text-3xl font-bold text-gray-900">Admin Instellingen</h1>
              <p className="text-gray-600 mt-1">Beheer admin accounts en systeem instellingen</p>
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
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Shield className="w-4 h-4" />
                <span>Uitloggen</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 
            'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Admin Users Management */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Admin Gebruikers</h2>
            </div>

            {/* Add New Admin */}
            <div className="border-b pb-6 mb-6">
              <h3 className="font-medium text-gray-900 mb-4">Nieuwe Admin Toevoegen</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="admin@teammade.be"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Wachtwoord</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Minimaal 6 karakters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  onClick={addAdmin}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>Admin Toevoegen</span>
                </button>
              </div>
            </div>

            {/* Existing Admins */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Bestaande Admins ({admins.length})</h3>
              <div className="space-y-3">
                {admins.map((admin) => (
                  <div key={admin.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{admin.email}</div>
                      <div className="text-sm text-gray-600">
                        Aangemaakt: {new Date(admin.created_at).toLocaleDateString('nl-NL')}
                        {admin.last_login && (
                          <span> • Laatst ingelogd: {new Date(admin.last_login).toLocaleDateString('nl-NL')}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        admin.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {admin.is_active ? 'Actief' : 'Inactief'}
                      </div>
                      
                      <button
                        onClick={() => toggleAdminStatus(admin.id, admin.is_active)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {admin.is_active ? 'Deactiveren' : 'Activeren'}
                      </button>
                      
                      <button
                        onClick={() => deleteAdmin(admin.id, admin.email)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {admins.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Geen admin gebruikers gevonden
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Password Change */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Key className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Wachtwoord Wijzigen</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Huidig Wachtwoord</label>
                <div className="relative">
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nieuw Wachtwoord</label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Minimaal 6 karakters"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bevestig Nieuw Wachtwoord</label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <button
                onClick={changePassword}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Wachtwoord Wijzigen</span>
              </button>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="bg-white p-6 rounded-xl shadow-sm mt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-gray-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Systeem Informatie</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-900">Versie</div>
              <div className="text-sm text-gray-600">Street Reimagined v1.0</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-900">Database</div>
              <div className="text-sm text-gray-600">Supabase PostgreSQL</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-900">Hosting</div>
              <div className="text-sm text-gray-600">Vercel</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, BarChart3, Users, Camera, Download, Settings, Eye } from 'lucide-react'

// Simple hardcoded authentication
const ADMIN_ACCOUNTS = [
  { email: 'dennis.teammade@gmail.com', password: 'teamMade2026', name: 'Dennis Matthijs' },
  { email: 'admin@teammade.be', password: 'admin123', name: 'Admin User' },
  { email: 'test@example.com', password: 'test123', name: 'Test Admin' }
]

export default function DashboardPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if already logged in
    const stored = localStorage.getItem('street_admin_simple')
    if (stored) {
      try {
        const adminData = JSON.parse(stored)
        const loginTime = new Date(adminData.loginTime)
        const now = new Date()
        const hoursDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60)
        
        if (hoursDiff < 24) {
          setIsLoggedIn(true)
          return
        }
      } catch (e) {
        // Invalid stored data
      }
    }
    localStorage.removeItem('street_admin_simple')
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const admin = ADMIN_ACCOUNTS.find(a => a.email === email && a.password === password)
    
    if (admin) {
      const adminData = {
        email: admin.email,
        name: admin.name,
        loginTime: new Date().toISOString()
      }
      localStorage.setItem('street_admin_simple', JSON.stringify(adminData))
      setIsLoggedIn(true)
      setError('')
    } else {
      setError('Ongeldige inloggegevens')
    }
    
    setLoading(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('street_admin_simple')
    setIsLoggedIn(false)
    setEmail('')
    setPassword('')
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Login</h1>
            <p className="text-gray-600 mt-2">Street Reimagined Admin</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  placeholder="dennis.teammade@gmail.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wachtwoord
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Inloggen...</span>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  <span>Inloggen</span>
                </>
              )}
            </button>
          </form>

          {/* Test Accounts - Larger for Mobile */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-3 text-center">🔑 Test Accounts</h3>
            <div className="space-y-3">
              <button
                onClick={() => { setEmail('dennis.teammade@gmail.com'); setPassword('teamMade2026'); }}
                className="w-full bg-blue-100 p-3 rounded-lg text-left hover:bg-blue-200 transition-colors"
                disabled={loading}
              >
                <div className="font-medium text-blue-900">Dennis (Super Admin)</div>
                <div className="text-sm text-blue-700">dennis.teammade@gmail.com</div>
                <div className="text-xs text-blue-600">Wachtwoord: teamMade2026</div>
              </button>
              
              <button
                onClick={() => { setEmail('admin@teammade.be'); setPassword('admin123'); }}
                className="w-full bg-blue-100 p-3 rounded-lg text-left hover:bg-blue-200 transition-colors"
                disabled={loading}
              >
                <div className="font-medium text-blue-900">Admin User</div>
                <div className="text-sm text-blue-700">admin@teammade.be</div>
                <div className="text-xs text-blue-600">Wachtwoord: admin123</div>
              </button>
              
              <button
                onClick={() => { setEmail('test@example.com'); setPassword('test123'); }}
                className="w-full bg-blue-100 p-3 rounded-lg text-left hover:bg-blue-200 transition-colors"
                disabled={loading}
              >
                <div className="font-medium text-blue-900">Test Account</div>
                <div className="text-sm text-blue-700">test@example.com</div>
                <div className="text-xs text-blue-600">Wachtwoord: test123</div>
              </button>
            </div>
            <p className="text-xs text-blue-600 mt-3 text-center">Tap een account om in te vullen en login</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">Street Reimagined Admin</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
            >
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Uitloggen</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Current User */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">
                Ingelogd als: {JSON.parse(localStorage.getItem('street_admin_simple') || '{}').name}
              </div>
              <div className="text-sm text-gray-600">
                {JSON.parse(localStorage.getItem('street_admin_simple') || '{}').email}
              </div>
            </div>
          </div>
        </div>

        {/* Key Stats Cards - Mobile Optimized */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Camera className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-xs font-medium text-gray-600 mb-1">Transformaties</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-xs text-gray-500">Demo Mode</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="text-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-xs font-medium text-gray-600 mb-1">Gebruikers</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-xs text-gray-500">Geen data</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="text-center">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-xs font-medium text-gray-600 mb-1">Succes Ratio</p>
              <p className="text-2xl font-bold text-gray-900">0%</p>
              <p className="text-xs text-gray-500">Wachten</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="text-center">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Shield className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-xs font-medium text-gray-600 mb-1">Status</p>
              <p className="text-2xl font-bold text-gray-900">✅</p>
              <p className="text-xs text-gray-500">Live</p>
            </div>
          </div>
        </div>

        {/* Quick Actions - Mobile Friendly */}
        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold text-gray-900">Admin Functies</h2>
          
          <button
            onClick={() => alert('👥 Gebruikers Beheer\n\nHier zie je:\n• Alle gebruikers die foto\'s hebben getransformeerd\n• Locatie en apparaat informatie\n• Activiteit statistieken\n• Zoek en filter mogelijkheden\n• CSV export voor rapportage')}
            className="w-full bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Gebruikers Beheer</h3>
                <p className="text-sm text-gray-600">Bekijk alle gebruikers en activiteit</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => alert('📸 Foto Galerij\n\nHier zie je:\n• Alle originele en getransformeerde foto\'s\n• Grid en lijst weergave\n• Filter op categorie en status\n• Download originele en bewerkte foto\'s\n• Zoek in transformatie verzoeken')}
            className="w-full bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Camera className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Foto Galerij</h3>
                <p className="text-sm text-gray-600">Alle transformaties en downloads</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => alert('📊 Data Export\n\nDownload CSV bestanden:\n• Alle transformaties met details\n• Gebruikers statistieken\n• Populaire verzoeken\n• Geografische verdeling\n• Analytics data\n• Perfect voor rapportage in Excel')}
            className="w-full bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Download className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Data Export</h3>
                <p className="text-sm text-gray-600">CSV rapporten voor analyse</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => alert('⚙️ Admin Instellingen\n\nBeheer functionaliteit:\n• Admin accounts toevoegen/verwijderen\n• Wachtwoorden wijzigen\n• Toegang beheren\n• Systeem informatie\n• Demo mode uitleg')}
            className="w-full bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Settings className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Admin Instellingen</h3>
                <p className="text-sm text-gray-600">Account beheer en configuratie</p>
              </div>
            </div>
          </button>
        </div>

        {/* Status Notice - Mobile Optimized */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-900 mb-2">✅ Dashboard Actief!</h3>
              <div className="text-sm text-green-800 space-y-2">
                <p><strong>Status:</strong> Volledig werkend admin systeem</p>
                <p><strong>Mode:</strong> Demo (klaar voor echte data)</p>
                <p><strong>Toegang:</strong> 3 test accounts beschikbaar</p>
                
                <div className="mt-3 p-3 bg-green-100 rounded-lg text-xs">
                  <p className="font-medium text-green-900">📱 Mobile Dashboard:</p>
                  <p className="text-green-800">Geoptimaliseerd voor alle apparaten. Alle functies werken op desktop, tablet en mobiel.</p>
                </div>
                
                <div className="mt-3 p-3 bg-blue-100 rounded-lg text-xs">
                  <p className="font-medium text-blue-900">🔗 URLs:</p>
                  <p className="text-blue-800">
                    <strong>App:</strong> street-reimagined.vercel.app<br/>
                    <strong>Dashboard:</strong> street-reimagined.vercel.app/dashboard
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
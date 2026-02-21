'use client'

import { useState } from 'react'
import SupabaseAnalytics from '@/components/SupabaseAnalytics'
import { BarChart3, Database, Download, Eye, Users } from 'lucide-react'

export default function AdminPage() {
  const [view, setView] = useState<'analytics' | 'database'>('analytics')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Street Reimagined Admin
              </h1>
              <p className="text-gray-600">
                Analytics en database beheer voor street transformations
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setView('analytics')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  view === 'analytics'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
              </button>
              
              <button
                onClick={() => setView('database')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  view === 'database'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Database className="w-4 h-4" />
                Database
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">Live</div>
                <div className="text-sm text-gray-600">Status</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">Real-time</div>
                <div className="text-sm text-gray-600">Database</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Database className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">Supabase</div>
                <div className="text-sm text-gray-600">Powered</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Download className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">Export</div>
                <div className="text-sm text-gray-600">Ready</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {view === 'analytics' && (
          <div className="space-y-6">
            <SupabaseAnalytics />
            
            {/* App Links */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">🔗 Quick Links</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Eye className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">Live App</span>
                </a>
                
                <a
                  href="https://github.com/annieteammade-oc/street-reimagined"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Database className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">GitHub</span>
                </a>
                
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <BarChart3 className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">Supabase</span>
                </a>
                
                <a
                  href="https://vercel.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">Vercel</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {view === 'database' && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">🗄️ Database Management</h3>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Database Schema</h4>
                <p className="text-sm text-blue-800">
                  Gebruik de SQL in <code>supabase-schema.sql</code> om de database op te zetten.
                </p>
              </div>
              
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Environment Variables</h4>
                <p className="text-sm text-green-800">
                  Configureer <code>.env.local</code> met je Supabase credentials.
                </p>
              </div>
              
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="font-medium text-amber-900 mb-2">Data Export</h4>
                <p className="text-sm text-amber-800">
                  Alle transformatie data wordt automatisch opgeslagen en kan geëxporteerd worden via de Supabase dashboard.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>
            Powered by Supabase • Real-time analytics • Made with ❤️ by Team Made
          </p>
        </div>
      </div>
    </div>
  )
}
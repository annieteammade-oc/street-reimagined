'use client'

import { useEffect } from 'react'
import { AdminAuth } from '@/lib/admin-auth'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    if (!AdminAuth.isAuthenticated()) {
      router.push('/admin/login')
    } else {
      // Redirect to dashboard if authenticated
      router.push('/admin/dashboard')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex items-center gap-3 text-gray-600">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span>Admin dashboard laden...</span>
      </div>
    </div>
  )
}
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect /admin to /dashboard
    router.push('/dashboard')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Doorsturen naar dashboard...</p>
      </div>
    </div>
  )
}
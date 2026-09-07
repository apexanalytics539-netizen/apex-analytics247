'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

const ADMIN_EMAIL = 'apexanalytics539@gmail.com'

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check on mount
    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuth()
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      // If no session, redirect to sign in
      if (sessionError || !session) {
        console.log('No session found, redirecting to sign in')
        router.replace('/auth/signin')
        return
      }

      const user = session.user
      
      // Check if the user is admin
      if (user.email === ADMIN_EMAIL) {
        console.log('Admin access granted for:', user.email)
        setIsAuthorized(true)
        setLoading(false)
        return
      }

      // Not admin, redirect to dashboard
      console.log('Non-admin user, redirecting to dashboard:', user.email)
      router.replace('/dashboard')
      
    } catch (error) {
      console.error('AdminGuard error:', error)
      router.replace('/auth/signin')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0c12] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}
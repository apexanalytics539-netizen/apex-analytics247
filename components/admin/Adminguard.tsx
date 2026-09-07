'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2, ShieldAlert } from 'lucide-react'

const ADMIN_EMAIL = 'apexanalytics539@gmail.com'

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'checking' | 'allowed' | 'denied'>('checking')
  const router = useRouter()

  useEffect(() => {
    checkAccess()
    // Re-check if the user signs out / switches accounts in another tab.
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      console.log('🔍 AdminGuard - Auth state changed, re-checking...')
      checkAccess()
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const checkAccess = async () => {
    try {
      console.log('🔍 AdminGuard - Checking access...')
      
      const { data: { user }, error } = await supabase.auth.getUser()
      
      console.log('🔍 AdminGuard - User object:', user)
      console.log('🔍 AdminGuard - User email:', user?.email)
      
      if (error) {
        console.error('❌ AdminGuard - Auth error:', error)
        router.replace('/auth/signin')
        return
      }

      if (!user) {
        console.log('❌ AdminGuard - No user found, redirecting to signin')
        router.replace('/auth/signin')
        return
      }

      console.log('📧 AdminGuard - User email:', user.email)
      console.log('🔑 AdminGuard - Admin email:', ADMIN_EMAIL)
      console.log('✅ AdminGuard - Match?', user.email === ADMIN_EMAIL)

      // ✅ Check if email matches admin email
      if (user.email === ADMIN_EMAIL) {
        console.log('✅ AdminGuard - Admin access granted for:', user.email)
        setStatus('allowed')
        return
      }

      console.log('❌ AdminGuard - Not admin, redirecting to dashboard')
      setStatus('denied')
      setTimeout(() => router.replace('/dashboard'), 1200)
    } catch (err) {
      console.error('❌ AdminGuard - Unexpected error:', err)
      router.replace('/auth/signin')
    }
  }

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-[#0a0c12] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    )
  }

  if (status === 'denied') {
    return (
      <div className="min-h-screen bg-[#0a0c12] flex items-center justify-center">
        <div className="text-center space-y-3">
          <ShieldAlert className="w-10 h-10 text-red-400 mx-auto" />
          <p className="text-slate-300 text-sm">You don&apos;t have access to this page. Redirecting...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
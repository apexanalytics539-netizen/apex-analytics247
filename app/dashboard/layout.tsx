'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [fixtureCount, setFixtureCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    checkUser()
    loadFixtureCount()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/signin'); return }
    setUser(user)
    setLoading(false)
  }

  const loadFixtureCount = async () => {
    const { count } = await supabase.from('fixtures').select('*', { count: 'exact', head: true }).eq('status', 'ANALYZED')
    setFixtureCount(count || 0)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] text-gray-200 flex font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      <Sidebar fixtureCount={fixtureCount} onSignOut={handleSignOut} />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
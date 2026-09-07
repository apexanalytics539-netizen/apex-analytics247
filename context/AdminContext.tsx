'use client'

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react'

export type AdminSection = 'compose' | 'leagues' | 'fixtures' | 'ai' | 'users' | 'bots' | 'approvals' | 'receipts' | 'settings'

interface AdminContextType {
  section: AdminSection
  navigateTo: (section: AdminSection) => void
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [section, setSection] = useState<AdminSection>('compose')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const sectionParam = params.get('section') as AdminSection
      if (sectionParam) {
        console.log('🔍 Context - Initial section from URL:', sectionParam)
        setSection(sectionParam)
      }
    }
  }, [])

  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        const sectionParam = params.get('section') as AdminSection
        if (sectionParam) {
          console.log('🔍 Context - PopState section:', sectionParam)
          setSection(sectionParam)
        }
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigateTo = useCallback((newSection: AdminSection) => {
    console.log('🔍 Context - Navigating to:', newSection)
    setSection(newSection)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      params.set('section', newSection)
      const newUrl = `${window.location.pathname}?${params}`
      window.history.pushState({ section: newSection }, '', newUrl)
      console.log('🔍 Context - URL updated to:', newUrl)
    }
  }, [])

  return (
    <AdminContext.Provider value={{ section, navigateTo }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }
  return context
}
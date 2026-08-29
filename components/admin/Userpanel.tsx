'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2, Search, ShieldCheck, ShieldOff, Ban, CheckCircle2, Trash2, AlertCircle } from 'lucide-react'

type Profile = {
  id: string
  email: string | null
  is_admin: boolean
  banned: boolean
  created_at: string
}

export default function UsersPanel() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    loadProfiles()
  }, [])

  const loadProfiles = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (error) {
      console.error('Error loading profiles:', error)
      setMessage({ type: 'error', text: 'Could not load users \u2014 check the profiles table/RLS policies.' })
    } else {
      setProfiles(data || [])
    }
    setLoading(false)
  }

  const toggleAdmin = async (profile: Profile) => {
    setBusyId(profile.id)
    const { error } = await supabase.from('profiles').update({ is_admin: !profile.is_admin }).eq('id', profile.id)
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      await loadProfiles()
    }
    setBusyId(null)
  }

  const callPrivilegedAction = async (action: 'ban' | 'unban' | 'delete', userId: string) => {
    setBusyId(userId)
    setMessage(null)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const { data, error } = await supabase.functions.invoke('admin-manage-user', {
        body: { action, userId },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      setMessage({ type: 'success', text: `Action "${action}" completed.` })
      await loadProfiles()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || `Failed to ${action} user.` })
    } finally {
      setBusyId(null)
      setConfirmDelete(null)
    }
  }

  const filtered = profiles.filter((p) => (p.email || '').toLowerCase().includes(query.toLowerCase()) || p.id.includes(query))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {message && (
        <div
          className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl border ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-lg px-3 py-2 max-w-sm">
        <Search className="w-4 h-4 text-slate-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by email or user ID..."
          className="w-full bg-transparent text-sm text-slate-200 focus:outline-none placeholder:text-slate-600"
        />
      </div>

      <div className="bg-[#12141c] border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/[0.02] text-left text-[11px] uppercase tracking-wider text-slate-500">
              <th className="p-3">User</th>
              <th className="p-3">Joined</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((profile) => (
                <tr key={profile.id} className="border-t border-white/5">
                  <td className="p-3">
                    <div className="text-slate-200">{profile.email || 'No email'}</div>
                    <div className="text-[10px] text-slate-600 font-mono">{profile.id}</div>
                  </td>
                  <td className="p-3 text-slate-400">{new Date(profile.created_at).toLocaleDateString()}</td>
                  <td className="p-3">
                    <div className="flex gap-1.5 flex-wrap">
                      {profile.is_admin && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">Admin</span>
                      )}
                      {profile.banned && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">Banned</span>
                      )}
                      {!profile.is_admin && !profile.banned && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">Active</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => toggleAdmin(profile)}
                        disabled={busyId === profile.id}
                        title={profile.is_admin ? 'Remove admin access' : 'Make admin'}
                        className="p-1.5 rounded-md border border-white/10 text-slate-400 hover:text-indigo-300 hover:border-indigo-500/30 disabled:opacity-40 transition"
                      >
                        {profile.is_admin ? <ShieldOff className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => callPrivilegedAction(profile.banned ? 'unban' : 'ban', profile.id)}
                        disabled={busyId === profile.id}
                        title={profile.banned ? 'Unban user' : 'Ban user'}
                        className="p-1.5 rounded-md border border-white/10 text-slate-400 hover:text-amber-300 hover:border-amber-500/30 disabled:opacity-40 transition"
                      >
                        {busyId === profile.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                      </button>
                      {confirmDelete === profile.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => callPrivilegedAction('delete', profile.id)}
                            className="text-[11px] font-bold text-red-400 border border-red-500/30 hover:bg-red-500/10 px-2 py-1 rounded-md"
                          >
                            Confirm
                          </button>
                          <button onClick={() => setConfirmDelete(null)} className="text-[11px] text-slate-500 px-2 py-1">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(profile.id)}
                          disabled={busyId === profile.id}
                          title="Delete user"
                          className="p-1.5 rounded-md border border-white/10 text-slate-400 hover:text-red-400 hover:border-red-500/30 disabled:opacity-40 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center text-slate-500 py-10">
                  No users match "{query}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
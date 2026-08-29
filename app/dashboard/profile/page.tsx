'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { User, Mail, Calendar, Save, UploadCloud } from 'lucide-react'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getUser()
  }, [])

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    setFullName(user?.user_metadata?.full_name || '')
    setAvatarUrl(user?.user_metadata?.avatar_url || '')
    setLoading(false)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}_${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file)
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
      setAvatarUrl(data.publicUrl)
    } catch (err) {
      console.error('Upload failed:', err)
    }
  }

  const updateProfile = async () => {
    setSaving(true)
    await supabase.auth.updateUser({ data: { full_name: fullName, avatar_url: avatarUrl } })
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>
      {loading ? <div>Loading...</div> : (
        <div className="bg-[rgba(18,23,33,0.75)] border border-white/5 p-6 rounded-2xl max-w-lg space-y-6">
          <div className="flex items-center gap-4">
            <div 
              className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center text-2xl cursor-pointer overflow-hidden border-2 border-emerald-500/30"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" /> : <User className="w-12 h-12 text-emerald-400" />}
            </div>
            <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageUpload} className="hidden" />
            <div>
              <div className="text-lg font-bold">{fullName || 'User'}</div>
              <div className="text-sm text-gray-400">Click avatar to change photo</div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-400">Display Name</label>
              <input 
                value={fullName} onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/30"
              />
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <Mail className="w-4 h-4" /> {user?.email}
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <Calendar className="w-4 h-4" /> Joined {new Date(user?.created_at).toLocaleDateString()}
            </div>
          </div>
          <button onClick={updateProfile} disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-500 py-2 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Update Profile</>}
          </button>
        </div>
      )}
    </div>
  )
}
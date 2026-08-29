'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Shield, Bell, Moon, LogOut, Send, X, Check, Loader2 } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isStepOne, setIsStepOne] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleOpenModal = () => {
    setIsModalOpen(true)
    setIsStepOne(true)
  }

  const handleStepOneContinue = () => {
    // REPLACE WITH YOUR TELEGRAM BOT LINK
    window.open('https://t.me/YourBotName_bot', '_blank')
    setIsStepOne(false)
  }

  const handleStepTwoConfirm = async () => {
    setIsSyncing(true)
    // SIMULATING THE BACKEND CALL TO FETCH CHAT_ID
    setTimeout(() => {
      setIsSyncing(false)
      setIsModalOpen(false)
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="bg-[rgba(18,23,33,0.75)] border border-white/5 p-6 rounded-2xl max-w-lg space-y-6">
        
        <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-gray-400" />
            <span className="text-sm">Notifications</span>
          </div>
          <div className="w-10 h-6 bg-emerald-500/30 rounded-full relative cursor-pointer">
            <div className="w-4 h-4 bg-emerald-400 rounded-full absolute right-1 top-1"></div>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
          <div className="flex items-center gap-3">
            <Moon className="w-5 h-5 text-gray-400" />
            <span className="text-sm">Dark Mode</span>
          </div>
          <div className="w-10 h-6 bg-emerald-500/30 rounded-full relative cursor-pointer">
            <div className="w-4 h-4 bg-emerald-400 rounded-full absolute right-1 top-1"></div>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-gray-400" />
            <span className="text-sm">API Key Access</span>
          </div>
          <span className="text-xs text-emerald-400">Active</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
          <div className="flex items-center gap-3">
            <Send className="w-5 h-5 text-cyan-400" />
            <span className="text-sm">Telegram Connection</span>
          </div>
          <button onClick={handleOpenModal} className="px-3 py-1 bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 rounded-lg text-xs font-bold hover:bg-cyan-600/30">
            Connect
          </button>
        </div>

        <button onClick={handleLogout} className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      {/* TELEGRAM CONNECT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b0e14] border border-white/10 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-cyan-400" /> Connect Telegram
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {isStepOne ? (
                <>
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-white mb-2">Step 1: Open Telegram</h3>
                    <p className="text-gray-400 text-sm">
                      Click the button below to open your Telegram bot. Send <span className="bg-black/40 px-2 py-0.5 rounded font-mono text-cyan-400">/start</span>.
                    </p>
                  </div>
                  <button onClick={handleStepOneContinue} className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-bold text-white transition">
                    Open Telegram
                  </button>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Step 2: Confirm Connection</h3>
                    <p className="text-gray-400 text-sm">Have you sent <span className="bg-black/40 px-2 py-0.5 rounded font-mono text-cyan-400">/start</span> to the bot?</p>
                  </div>
                  <button onClick={handleStepTwoConfirm} disabled={isSyncing} className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-white transition disabled:opacity-50">
                    {isSyncing ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Confirm & Connect'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
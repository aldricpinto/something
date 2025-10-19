import { useEffect, useState } from 'react'
import ParticlesBackground from '../components/ParticlesBackground'

export default function Settings(){
  const [time, setTime] = useState(localStorage.getItem('ss_notify_time') || '07:00')
  const [enabled, setEnabled] = useState(localStorage.getItem('ss_notify_enabled') === 'true')
  const [theme, setTheme] = useState(localStorage.getItem('ss_theme') || 'system')

  useEffect(()=>{
    localStorage.setItem('ss_notify_time', time)
  },[time])
  useEffect(()=>{
    localStorage.setItem('ss_notify_enabled', String(enabled))
  },[enabled])
  useEffect(()=>{
    localStorage.setItem('ss_theme', theme)
    document.documentElement.classList.toggle('dark', theme==='dark')
  },[theme])

  return (
    <div className="relative">
      <ParticlesBackground />
      <div className="max-w-3xl mx-auto px-4 pt-28 pb-12">
        <div className="text-2xl font-display mb-4">Settings</div>
        <div className="grid gap-4">
          <div className="glass p-4">
            <div className="font-semibold">Daily Reminders</div>
            <div className="mt-3 flex items-center gap-4">
              <label className="flex items-center gap-2"><input type="checkbox" checked={enabled} onChange={e=> setEnabled(e.target.checked)} /> Enable notifications</label>
              <input type="time" value={time} onChange={e=> setTime(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2" />
            </div>
            <div className="text-white/60 mt-2 text-sm">Notifications powered by OneSignal if configured.</div>
          </div>

          <div className="glass p-4">
            <div className="font-semibold">Theme</div>
            <div className="mt-3 flex items-center gap-4">
              <select value={theme} onChange={e=> setTheme(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

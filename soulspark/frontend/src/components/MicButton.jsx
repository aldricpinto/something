import { useEffect, useRef, useState } from 'react'

export default function MicButton({ onResult, title='Speak', className='' }){
  const recRef = useRef(null)
  const [active, setActive] = useState(false)
  const supported = typeof window !== 'undefined' && (
    window.SpeechRecognition || window.webkitSpeechRecognition
  )

  useEffect(()=>{
    if(!supported) return
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.continuous = false
    rec.interimResults = false
    rec.lang = navigator.language || 'en-US'
    rec.onresult = (e)=>{
      const t = Array.from(e.results).map(r=> r[0]?.transcript || '').join(' ')
      if(t && onResult) onResult(t)
    }
    rec.onend = ()=> setActive(false)
    recRef.current = rec
  },[supported, onResult])

  function toggle(){
    if(!supported) return
    if(active){ recRef.current?.stop(); setActive(false) }
    else { try{ recRef.current?.start(); setActive(true) }catch{ /* ignore */ } }
  }

  return (
    <button type="button" onClick={toggle} title={supported? title : 'Voice input not supported'}
      className={`px-2 py-2 rounded-xl border border-white/10 ${active? 'bg-red-500/80 text-white' : 'bg-white/10 text-white/80 hover:bg-white/15'} ${className}`}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z"/>
        <path d="M19 11a7 7 0 0 1-14 0M12 18v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
      </svg>
    </button>
  )
}

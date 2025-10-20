import React, { useState } from 'react'
import { getEncouragement } from '../utils/api'
import { motion, AnimatePresence } from 'framer-motion'
import { fadeInUp, fadeIn, pop, spring } from '../utils/anim'

const moods = ['anxious','grateful','hopeful','tired','lonely','stressed']

export default function MoodPrompt(){
  const [mood, setMood] = useState('')
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  async function submit(){
    if(!mood && !text) return
    setLoading(true)
    try{
      const data = await getEncouragement(mood || '', text || undefined)
      setResult(data)
    }catch(e){
      setResult({ verse: 'Psalm 23:1', message: 'The Lord cares for you', encouragement: 'God is near and guiding you.' })
    }finally{
      setLoading(false)
    }
}

function MoodDropdown({ mood, setMood }){
  const [open, setOpen] = useState(false)
  const wrapRef = React.useRef(null)

  function toggle(){ setOpen(o=>!o) }
  function choose(val){ setMood(val); setOpen(false) }
  function clear(){ setMood(''); setOpen(false) }

  // Close on outside click or Escape
  React.useEffect(()=>{
    function onDocClick(e){
      if(!wrapRef.current) return
      if(!wrapRef.current.contains(e.target)) setOpen(false)
    }
    function onKey(e){ if(e.key === 'Escape') setOpen(false) }
    if(open){
      document.addEventListener('mousedown', onDocClick)
      document.addEventListener('keydown', onKey)
    }
    return ()=>{
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  },[open])

  return (
    <div className="mb-3 relative" ref={wrapRef}>
      <button
        type="button"
        onClick={toggle}
        className="w-full md:w-72 flex items-center justify-between gap-2 bg-slate-800/80 text-white border border-white/10 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20"
      >
        <span className={mood? '':'text-white/60'}>{mood || 'Select a mood (optional)'}</span>
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white/70">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{opacity:0, y:6}}
            animate={{opacity:1, y:0}}
            exit={{opacity:0, y:6}}
            transition={spring}
            className="absolute z-30 bottom-full mb-2 w-full md:w-72 rounded-xl overflow-hidden border border-white/10 shadow-xl"
          >
            <div className="bg-slate-900/95 backdrop-blur max-h-60 overflow-auto overscroll-contain">
              <button onClick={clear} className="w-full text-left px-3 py-2 text-white/80 hover:bg-white/10">No mood</button>
              <div className="h-px bg-white/10" />
              {moods.map(m => (
                <button
                  key={m}
                  onClick={()=> choose(m)}
                  className={`w-full text-left px-3 py-2 hover:bg-white/10 ${mood===m? 'bg-white/10 text-white':'text-white/90'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

  return (
    <div className="mt-8">
      <motion.div className="glass p-4 md:p-6" variants={pop} initial="hidden" animate="show" transition={spring}>
        <div className="text-white/80 mb-3">How's your heart today?</div>
        <MoodDropdown mood={mood} setMood={setMood} />
        <div className="flex gap-2">
          <input value={text} onChange={e=> setText(e.target.value)} placeholder="Share what's on your heart..." className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20" />
          <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={submit} className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-400/60 via-purple-400/60 to-yellow-300/60 text-slate-900 font-semibold">Let's Pray</motion.button>
        </div>
      </motion.div>

      <AnimatePresence>
        {loading && (
          <motion.div variants={fadeIn} initial="hidden" animate="show" exit="exit" className="glass p-6 mt-4 text-center">Praying...</motion.div>
        )}
      </AnimatePresence>

      {result && (
        <motion.div variants={fadeInUp} initial="hidden" animate="show" transition={spring} className="glass p-6 mt-4">
          <div className="text-sm text-white/70 uppercase">Personalized Encouragement</div>
          <div className="mt-2 font-display text-xl">{result.verse}</div>
          <p className="mt-2 text-white/80"><span className="font-semibold">Message:</span> {result.message}</p>
          <p className="mt-1 text-white/90"><span className="font-semibold">Encouragement:</span> {result.encouragement}</p>
        </motion.div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { getEncouragement } from '../utils/api'
import { motion, AnimatePresence } from 'framer-motion'

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
      const data = await getEncouragement(mood || 'custom', text || undefined)
      setResult(data)
    }catch(e){
      setResult({ verse: 'Psalm 23:1', message: 'The Lord cares for you', encouragement: 'God is near and guiding you.' })
    }finally{
      setLoading(false)
    }
  }

  return (
    <div className="mt-8">
      <div className="glass p-4 md:p-6">
        <div className="text-white/80 mb-3">How’s your heart today?</div>
        <div className="flex flex-wrap gap-2 mb-3">
          {moods.map(m => (
            <button key={m} onClick={()=> setMood(m)} className={`px-3 py-1 rounded-full border border-white/15 hover:bg-white/10 ${mood===m? 'bg-white/10': ''}`}>
              {m}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={text} onChange={e=> setText(e.target.value)} placeholder="Share what’s on your heart..." className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20" />
          <button onClick={submit} className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-400/60 via-purple-400/60 to-yellow-300/60 text-slate-900 font-semibold">Send</button>
        </div>
      </div>

      <AnimatePresence>
        {loading && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="glass p-6 mt-4 text-center">Thinking and praying over your request...</motion.div>
        )}
      </AnimatePresence>

      {result && (
        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="glass p-6 mt-4">
          <div className="text-sm text-white/70 uppercase">Personalized Encouragement</div>
          <div className="mt-2 font-display text-xl">{result.verse}</div>
          <p className="mt-2 text-white/80"><span className="font-semibold">Message:</span> {result.message}</p>
          <p className="mt-1 text-white/90"><span className="font-semibold">Encouragement:</span> {result.encouragement}</p>
        </motion.div>
      )}
    </div>
  )
}

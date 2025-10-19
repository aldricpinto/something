import { useEffect, useState } from 'react'
import { fetchTodayVerse } from '../utils/api'
import { motion } from 'framer-motion'

export default function DailyVerse(){
  const [data,setData] = useState(null)
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState(null)

  useEffect(()=>{
    let mounted = true
    fetchTodayVerse()
      .then(d=>{ if(mounted){ setData(d) } })
      .catch(e=> setError(e?.message || 'Failed to load verse'))
      .finally(()=> setLoading(false))
    return ()=>{ mounted=false }
  },[])

  if(loading) return <div className="glass p-8 text-center">Loading today\'s verse...</div>
  if(error) return <div className="glass p-8 text-center text-red-300">{error}</div>

  const { verse, reference, reflection, encouragement } = data || {}

  return (
    <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{duration: .6}} className="glass p-6 md:p-8 card-hover">
      <div className="text-center">
        <div className="text-sm text-white/70 mb-2 uppercase tracking-widest">Daily Verse</div>
        <h1 className="font-display text-2xl md:text-4xl leading-relaxed text-white/95">
          {verse}
        </h1>
        {reference && (
          <div className="mt-2 text-white/70">— {reference}</div>
        )}
      </div>
      {reflection && (
        <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.2}} className="mt-6 text-white/80">
          <span className="font-semibold">Reflection:</span> {reflection}
        </motion.p>
      )}
      {encouragement && (
        <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.3}} className="mt-3 text-white/90">
          <span className="font-semibold">Encouragement:</span> {encouragement}
        </motion.p>
      )}
    </motion.div>
  )
}

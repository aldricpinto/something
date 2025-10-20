import { useEffect, useState } from 'react'
import { fetchTodayVerse } from '../utils/api'
import { motion } from 'framer-motion'
import { fadeInUp, spring } from '../utils/anim'

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

  if(loading) return <div className="glass p-8 text-center">Loading today's verse...</div>
  if(error) return <div className="glass p-8 text-center text-red-300">{error}</div>

  const { verse, reference, reflection, encouragement } = data || {}

  // Sanitize any markdown/special markers that might leak from AI output or legacy rows
  const clean = (s) => (s || '')
    .replace(/[\*`_#]/g, '')
    .replace(/\bOne[- ]Sentence:?\b/gi, '')
    .replace(/\bReflection:?\b/gi, '')
    .replace(/\bEncouragement:?\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()

  const reflectionClean = clean(reflection)
  const encouragementClean = clean(encouragement)
  const referenceClean = clean(reference)

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="show"
      transition={spring}
      className="glass p-6 md:p-8 card-hover"
    >
      <div className="text-center">
        <div className="text-sm text-white/70 mb-2 uppercase tracking-widest">Daily Verse</div>
        <h1 className="font-display text-2xl md:text-4xl leading-relaxed text-white/95">
          {verse}
        </h1>
        {referenceClean && (
          <div className="mt-2 text-white/70">— {referenceClean}</div>
        )}
      </div>
      {reflectionClean && (
        <motion.p variants={fadeInUp} initial="hidden" animate="show" transition={{...spring, delay: .1}} className="mt-6 text-white/80">
          <span className="font-semibold">Reflection:</span> {reflectionClean}
        </motion.p>
      )}
      {encouragementClean && (
        <motion.p variants={fadeInUp} initial="hidden" animate="show" transition={{...spring, delay: .15}} className="mt-3 text-white/90">
          <span className="font-semibold">Encouragement:</span> {encouragementClean}
        </motion.p>
      )}
    </motion.div>
  )
}

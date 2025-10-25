import { useEffect, useState, useRef } from 'react'
import { listJournal, createJournal, deleteJournal, askJournal, updateJournal } from '../utils/api'
import { motion, AnimatePresence } from 'framer-motion'
import { fadeInUp, spring } from '../utils/anim'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)
import MicButton from './MicButton'

function AutoGrowTextarea({ value, onChange, placeholder='' }){
  const ref = useRef(null)
  useEffect(()=>{
    const el = ref.current
    if(!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  },[value])
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e)=> onChange(e.target.value)}
      placeholder={placeholder}
      className="textarea"
      rows={1}
      style={{overflow:'hidden'}}
    />
  )
}

export default function Journal(){
  const [entries, setEntries] = useState([])
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState('')
  // per-entry ask state
  const [askId, setAskId] = useState(null)
  const [askQuestion, setAskQuestion] = useState('')
  const [askAnswer, setAskAnswer] = useState('')
  const [askLoading, setAskLoading] = useState(false)

  async function load(){
    const data = await listJournal(true)
    setEntries(data)
  }

  useEffect(()=>{ load() },[])

  async function add(){
    const text = content.trim()
    if(!text || saving) return
    setSaving(true)
    setError('')
    try{
      const entry = await createJournal({ content: text })
      setEntries([entry, ...entries])
      setContent('')
    }catch(e){
      setError(e?.response?.data?.detail || 'Could not save entry. Please sign in and try again.')
    }finally{
      setSaving(false)
    }
  }

  async function remove(id){
    await deleteJournal(id)
    setEntries(entries.filter(e=> e.id !== id))
  }

  function beginEdit(entry){
    setEditingId(entry.id)
    setEditContent(entry.content)
    setEditError('')
  }

  function cancelEdit(){
    setEditingId(null)
    setEditContent('')
    setEditError('')
  }

  async function saveEdit(){
    const text = (editContent || '').trim()
    if(!editingId || !text || savingEdit) return
    setSavingEdit(true)
    setEditError('')
    try{
      const updated = await updateJournal(editingId, { content: text })
      setEntries(entries.map(e => e.id === updated.id ? updated : e))
      cancelEdit()
    }catch(e){
      setEditError(e?.response?.data?.detail || 'Could not update entry. Please try again.')
    }finally{
      setSavingEdit(false)
    }
  }

  async function ask(entryId){
    const q = (askQuestion||'').trim()
    if(!q) return
    setAskLoading(true)
    try{
      const { answer } = await askJournal(q, entryId)
      setAskAnswer(answer)
    }catch(e){
      setAskAnswer('Please try again in a moment.')
    }finally{
      setAskLoading(false)
    }
  }

  const shown = entries

  return (
    <div>
      <div className="glass p-4 md:p-6">
        <div className="flex items-center gap-2 mb-3">
          <AutoGrowTextarea value={content} onChange={setContent} placeholder="Write your reflection here..." />
          <MicButton onResult={(t)=> setContent(prev=> (prev? prev+" ":"")+t)} title='Speak to add entry' />
        </div>
        <div className="flex items-center justify-end">
          <button type="button" onClick={add} disabled={saving || !content.trim()} className={`btn btn-primary px-4 py-2 ${saving || !content.trim()? 'opacity-60 cursor-not-allowed' : ''}`}>{saving? 'Saving...' : 'Add Entry'}</button>
        </div>
        {error && <div className="text-red-300 text-sm mt-2">{error}</div>}
      </div>

      <div className="mt-6 grid gap-3">
        <AnimatePresence initial={false}>
        {shown.map(e => (
          <motion.div key={e.id} layout variants={fadeInUp} initial="hidden" animate="show" exit="exit" transition={spring} className="glass p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-3">
                {editingId === e.id ? (
                  <>
                    <div className="flex items-start gap-2">
                      <AutoGrowTextarea value={editContent} onChange={setEditContent} />
                      <MicButton onResult={(t)=> setEditContent(prev=> (prev? prev+" ":"")+t)} title='Speak to edit entry' />
                    </div>
                    {editError && <div className="text-red-300 text-sm mt-2">{editError}</div>}
                  </>
                ) : (
                  <>
                    <div className="text-white/80 whitespace-pre-wrap">{e.content}</div>
                    <div className="text-white/50 text-sm mt-1">{dayjs.utc(e.created_at).local().format('MMM D, YYYY h:mm A')}</div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                {editingId === e.id ? (
                  <>
                    <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.97}} onClick={saveEdit} disabled={savingEdit || !editContent.trim()} className={`btn btn-outline px-3 py-1 ${savingEdit || !editContent.trim()? 'opacity-60 cursor-not-allowed' : ''}`}>{savingEdit? 'Saving…' : 'Save'}</motion.button>
                    <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.97}} onClick={cancelEdit} className="btn btn-ghost px-3 py-1">Cancel</motion.button>
                  </>
                ) : (
                  <>
                    <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.97}} onClick={()=> beginEdit(e)} className="btn btn-outline px-3 py-1">Edit</motion.button>
                    <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.97}} onClick={()=> remove(e.id)} className="btn btn-outline px-3 py-1">Delete</motion.button>
                    <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.97}} onClick={()=> { setAskId(askId===e.id? null : e.id); setAskQuestion(''); setAskAnswer('') }} className="btn btn-outline px-3 py-1">Ask</motion.button>
                  </>
                )}
              </div>
            </div>
            {askId === e.id && (
              <div className="mt-3 bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="flex gap-2 items-center">
                  <input value={askQuestion} onChange={ev=> setAskQuestion(ev.target.value)} placeholder="Ask a question about this entry..." className="input" />
                  <MicButton onResult={(t)=> setAskQuestion(prev=> (prev? prev+" ":"")+t)} title='Speak your question' />
                  <button onClick={()=> ask(e.id)} className="btn btn-primary px-4 py-2">Ask</button>
                </div>
                <AnimatePresence>
                  {askLoading && (
                    <motion.div
                      initial={{opacity:0, y:4}}
                      animate={{opacity:1, y:0}}
                      exit={{opacity:0, y:4}}
                      transition={{duration:.25}}
                      className="text-white/70 mt-3 flex items-center gap-2"
                    >
                      <motion.span
                        className="inline-block w-2 h-2 rounded-full bg-white/60"
                        animate={{scale:[1,1.3,1], opacity:[.5,1,.5]}}
                        transition={{repeat:Infinity, duration:1, ease:'easeInOut'}}
                      />
                      <motion.span
                        className="inline-block w-2 h-2 rounded-full bg-white/60"
                        animate={{scale:[1,1.3,1], opacity:[.5,1,.5]}}
                        transition={{repeat:Infinity, duration:1, ease:'easeInOut', delay:.2}}
                      />
                      <motion.span
                        className="inline-block w-2 h-2 rounded-full bg-white/60"
                        animate={{scale:[1,1.3,1], opacity:[.5,1,.5]}}
                        transition={{repeat:Infinity, duration:1, ease:'easeInOut', delay:.4}}
                      />
                      <span>Praying...</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                {askAnswer && !askLoading && (()=>{
                  const lines = askAnswer.split(/\r?\n/).map(l=>l.trim()).filter(Boolean)
                  const verse = lines[0] || ''
                  const reflLine = lines.find(l=> l.toLowerCase().startsWith('reflection:')) || ''
                  const encLine = lines.find(l=> l.toLowerCase().startsWith('encouragement:')) || ''
                  const reflection = reflLine.replace(/^[Rr]eflection:\s*/, '') || lines[1] || ''
                  const encouragement = encLine.replace(/^[Ee]ncouragement:\s*/, '') || lines[2] || ''
                  return (
                    <motion.div
                      initial={{opacity:0, y:6}}
                      animate={{opacity:1, y:0}}
                      exit={{opacity:0, y:6}}
                      transition={{duration:.25}}
                      className="mt-3"
                    >
                      <div className="text-white/90 font-semibold">{verse}</div>
                      {reflection && (<p className="mt-2 text-white/80"><span className="font-semibold">Reflection:</span> {reflection}</p>)}
                      {encouragement && (<p className="mt-1 text-white/90"><span className="font-semibold">Encouragement:</span> {encouragement}</p>)}
                    </motion.div>
                  )
                })()}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

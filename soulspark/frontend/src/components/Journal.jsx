import { useEffect, useState } from 'react'
import { listJournal, createJournal, deleteJournal, askJournal, updateJournal } from '../utils/api'
import { motion, AnimatePresence } from 'framer-motion'
import { fadeInUp, spring } from '../utils/anim'
import dayjs from 'dayjs'

export default function Journal(){
  const [entries, setEntries] = useState([])
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [asking, setAsking] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState('')

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

  async function ask(){
    const q = question.trim()
    if(!q) return
    setAsking(true)
    try{
      const { answer } = await askJournal(q)
      setAnswer(answer)
    }catch(e){
      setAnswer('Please try again in a moment.')
    }finally{
      setAsking(false)
    }
  }

  const shown = entries

  return (
    <div>
      <div className="glass p-4 md:p-6">
        <div className="flex items-center gap-2 mb-3">
          <textarea value={content} onChange={e=> setContent(e.target.value)} placeholder="Write your reflection here..." rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20" />
        </div>
        <div className="flex items-center justify-end">
          <button type="button" onClick={add} disabled={saving || !content.trim()} className={`px-4 py-2 rounded-xl bg-gradient-to-r from-sky-400/60 via-purple-400/60 to-yellow-300/60 text-slate-900 font-semibold ${saving || !content.trim()? 'opacity-60 cursor-not-allowed' : ''}`}>{saving? 'Saving...' : 'Add Entry'}</button>
        </div>
        {error && <div className="text-red-300 text-sm mt-2">{error}</div>}
      </div>

      <div className="glass p-4 md:p-6 mt-4">
        <div className="text-white/90 font-semibold">Ask about your journal</div>
        <div className="mt-3 flex gap-2">
          <input value={question} onChange={e=> setQuestion(e.target.value)} placeholder="Ask a question based on your entries..." className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20" />
          <button onClick={ask} className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-400/60 via-purple-400/60 to-yellow-300/60 text-slate-900 font-semibold">Ask</button>
        </div>
        {asking && <div className="text-white/70 mt-3">Reflecting with Scripture...</div>}
        {answer && !asking && (
          <div className="text-white/90 mt-3">{answer}</div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-white/70">Your Journal</div>
      </div>

      <div className="mt-3 grid gap-3">
        <AnimatePresence initial={false}>
        {shown.map(e => (
          <motion.div key={e.id} layout variants={fadeInUp} initial="hidden" animate="show" exit="exit" transition={spring} className="glass p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-3">
                {editingId === e.id ? (
                  <>
                    <textarea
                      value={editContent}
                      onChange={ev=> setEditContent(ev.target.value)}
                      rows={4}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                    />
                    {editError && <div className="text-red-300 text-sm mt-2">{editError}</div>}
                  </>
                ) : (
                  <>
                    <div className="text-white/80 whitespace-pre-wrap">{e.content}</div>
                    <div className="text-white/50 text-sm mt-1">{dayjs(e.created_at).format('MMM D, YYYY h:mm A')}</div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                {editingId === e.id ? (
                  <>
                    <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.97}} onClick={saveEdit} disabled={savingEdit || !editContent.trim()} className={`px-3 py-1 rounded-lg bg-white/15 text-white ${savingEdit || !editContent.trim()? 'opacity-60 cursor-not-allowed' : ''}`}>{savingEdit? 'Saving…' : 'Save'}</motion.button>
                    <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.97}} onClick={cancelEdit} className="px-3 py-1 rounded-lg bg-white/5 text-white/80">Cancel</motion.button>
                  </>
                ) : (
                  <>
                    <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.97}} onClick={()=> beginEdit(e)} className="text-white/70 hover:text-white">Edit</motion.button>
                    <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.97}} onClick={()=> remove(e.id)} className="text-white/60 hover:text-white/90">Delete</motion.button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

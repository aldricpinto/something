import { useEffect, useState } from 'react'
import { listJournal, createJournal, deleteJournal } from '../utils/api'
import { motion } from 'framer-motion'
import dayjs from 'dayjs'

export default function Journal(){
  const [entries, setEntries] = useState([])
  const [content, setContent] = useState('')
  const [privateOnly, setPrivateOnly] = useState(false)
  const [isPrivate, setIsPrivate] = useState(false)

  async function load(){
    const data = await listJournal(true)
    setEntries(data)
  }

  useEffect(()=>{ load() },[])

  async function add(){
    if(!content.trim()) return
    const entry = await createJournal({ content, private: isPrivate })
    setEntries([entry, ...entries])
    setContent('')
  }

  async function remove(id){
    await deleteJournal(id)
    setEntries(entries.filter(e=> e.id !== id))
  }

  const shown = privateOnly ? entries.filter(e=> e.private) : entries

  return (
    <div>
      <div className="glass p-4 md:p-6">
        <div className="flex items-center gap-2 mb-3">
          <textarea value={content} onChange={e=> setContent(e.target.value)} placeholder="Write your reflection here..." rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20" />
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-white/80"><input type="checkbox" checked={isPrivate} onChange={e=> setIsPrivate(e.target.checked)} /> Share with God (private)</label>
          <button onClick={add} className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-400/60 via-purple-400/60 to-yellow-300/60 text-slate-900 font-semibold">Add Entry</button>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-white/70">Your Journal</div>
        <label className="text-white/70 flex items-center gap-2"><input type="checkbox" checked={privateOnly} onChange={e=> setPrivateOnly(e.target.checked)} /> Show only private</label>
      </div>

      <div className="mt-3 grid gap-3">
        {shown.map(e => (
          <motion.div key={e.id} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="glass p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-white/80 whitespace-pre-wrap">{e.content}</div>
                <div className="text-white/50 text-sm mt-1">{dayjs(e.created_at).format('MMM D, YYYY h:mm A')} {e.private ? '• Private' : ''}</div>
              </div>
              <button onClick={()=> remove(e.id)} className="text-white/60 hover:text-white/90">Delete</button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

import { Link, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function Navbar(){
  const navClass = ({isActive}) => `px-3 py-2 rounded-xl hover:bg-white/10 transition ${isActive? 'bg-white/10 text-white' : 'text-white/80'}`
  return (
    <div className="fixed top-0 left-0 right-0 z-40">
      <div className="max-w-5xl mx-auto mt-4 px-4">
        <motion.nav initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="glass flex items-center justify-between p-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400/60 via-purple-400/60 to-yellow-300/60" />
            <span className="font-display text-xl">SoulSpark</span>
          </Link>
          <div className="flex items-center gap-1">
            <NavLink className={navClass} to="/">Home</NavLink>
            <NavLink className={navClass} to="/journal">Journal</NavLink>
            <NavLink className={navClass} to="/settings">Settings</NavLink>
          </div>
        </motion.nav>
      </div>
    </div>
  )
}

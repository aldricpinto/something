import { Link, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/auth'

export default function Navbar(){
  const { user, logout } = useAuth()
  const navClass = ({isActive}) => `px-3 py-2 rounded-xl hover:bg-white/10 transition ${isActive? 'bg-white/10 text-white' : 'text-white/80'}`
  return (
    <div className="fixed top-0 left-0 right-0 z-40">
      <div className="mx-auto mt-4 px-4 max-w-7xl">
        <motion.nav initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="glass p-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo.svg" alt="logo" className="w-8 h-8 rounded-xl"/>
              <span className="font-display text-xl">Manna</span>
            </Link>
            <div className="flex items-center gap-1">
              <NavLink className={navClass} to="/">Home</NavLink>
              <NavLink className={navClass} to="/journal">Journal</NavLink>
              {user && (
                <div className="flex items-center gap-2 ml-2 pl-2 border-l border-white/10">
                  <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-sm text-white/90">
                    {(user.name || user.email || 'U').slice(0,1).toUpperCase()}
                  </div>
                  <button onClick={logout} className="btn btn-ghost px-3 py-1">Sign out</button>
                </div>
              )}
            </div>
          </div>
        </motion.nav>
      </div>
    </div>
  )
}

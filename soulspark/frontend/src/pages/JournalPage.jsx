import Journal from '../components/Journal'
import ParticlesBackground from '../components/ParticlesBackground'
import { useAuth } from '../context/auth'
import AuthGate from '../components/AuthGate'

export default function JournalPage(){
  const { user } = useAuth()
  return (
    <div className="relative">
      <ParticlesBackground />
      <div className="max-w-3xl mx-auto px-4 pt-28 pb-12">
        <div className="text-2xl font-display mb-4">Journal</div>
        {user ? <Journal /> : <AuthGate />}
      </div>
    </div>
  )
}

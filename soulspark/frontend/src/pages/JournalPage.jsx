import Journal from '../components/Journal'
import ParticlesBackground from '../components/ParticlesBackground'

export default function JournalPage(){
  return (
    <div className="relative">
      <ParticlesBackground />
      <div className="max-w-3xl mx-auto px-4 pt-28 pb-12">
        <div className="text-2xl font-display mb-4">Journal</div>
        <Journal />
      </div>
    </div>
  )
}

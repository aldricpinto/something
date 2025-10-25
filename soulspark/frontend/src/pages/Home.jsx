import DailyVerse from '../components/DailyVerse'
import MoodPrompt from '../components/MoodPrompt'
import ParticlesBackground from '../components/ParticlesBackground'

export default function Home(){
  return (
    <div className="relative">
      <ParticlesBackground />
      <div className="max-w-6xl mx-auto px-4 pt-28 pb-12">
        <div className="grid md:grid-cols-2 gap-4">
          <DailyVerse />
          <MoodPrompt />
        </div>
      </div>
    </div>
  )
}

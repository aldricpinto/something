import { useMemo } from 'react'
import { motion } from 'framer-motion'

export default function ParticlesBackground(){
  const particles = useMemo(()=>Array.from({length: 30}).map((_,i)=>({
    id: i,
    size: Math.random()*4 + 2,
    x: Math.random()*100,
    y: Math.random()*100,
    duration: Math.random()*10 + 10,
    delay: Math.random()*5,
    opacity: Math.random() * 0.4 + 0.2
  })),[])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p=> (
        <motion.div key={p.id}
          initial={{opacity: 0.0, y: 0}}
          animate={{
            opacity: p.opacity,
            y: [0, -15, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: p.duration,
            delay: p.delay,
            ease: 'easeInOut'
          }}
          className="rounded-full bg-white/30 blur-[1px]"
          style={{
            width: p.size,
            height: p.size,
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`
          }}
        />
      ))}
    </div>
  )
}

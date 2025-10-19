import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import OneSignal from 'react-onesignal'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import JournalPage from './pages/JournalPage'
// Settings removed

export default function App(){
  useEffect(()=>{
    const appId = import.meta.env.VITE_ONESIGNAL_APP_ID
    if(appId){
      OneSignal.init({ appId })
    }
  },[])

  // Night mode subtle change: after 8pm
  useEffect(()=>{
    const hour = new Date().getHours()
    const isNight = hour >= 20 || hour < 6
    if(isNight){
      document.documentElement.style.setProperty('--bg-gradient',
        'radial-gradient(1200px 600px at 20% 20%, rgba(135,206,250,0.12), transparent 60%),'+
        'radial-gradient(800px 400px at 80% 30%, rgba(186,85,211,0.18), transparent 60%),'+
        'radial-gradient(1000px 500px at 50% 90%, rgba(147,112,219,0.18), transparent 60%),'+
        'linear-gradient(180deg, #0b1020, #03050c)'
      )
    }
  },[])

  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="*" element={<Home />} />
        {/* Settings route removed */}
      </Routes>
    </div>
  )
}

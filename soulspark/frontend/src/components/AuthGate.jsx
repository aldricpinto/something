import { useEffect, useRef, useState } from 'react'
import { authWithGoogle } from '../utils/api'
import { useAuth } from '../context/auth'

export default function AuthGate(){
  const { save } = useAuth()
  const btnRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')

  useEffect(()=>{
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    let tries = 0
    function init(){
      if(!clientId){
        setError('Google sign-in is not configured')
        return
      }
      if(window.google && window.google.accounts && window.google.accounts.id){
        try{
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: async (resp) => {
              try{
                const auth = await authWithGoogle(resp.credential)
                save(auth)
              }catch(e){
                console.error('Google auth failed', e)
                setError('Sign-in failed. Please try again.')
              }
            }
          })
          if(btnRef.current){
            window.google.accounts.id.renderButton(btnRef.current, { theme: 'outline', size: 'large', text: 'continue_with' })
          }
          setReady(true)
          return
        }catch(e){ setError('Sign-in init failed') }
      }
      if(tries++ < 10){
        setTimeout(init, 300)
      }else{
        setError('Google script not loaded')
      }
    }
    init()
  },[save])

  return (
    <div className="glass p-6 text-center">
      <div className="text-white/90 text-lg">Sign in to use your private Journal</div>
      <div className="text-white/60 mt-1">Your entries stay tied to your account.</div>
      <div className="mt-4 flex flex-col items-center gap-3">
        <div ref={btnRef}></div>
        {!ready && (
          <div className="text-white/60 text-sm">
            {error || 'Preparing sign-in...'}
            <div className="mt-1">Set VITE_GOOGLE_CLIENT_ID in the frontend env.</div>
          </div>
        )}
      </div>
    </div>
  )
}

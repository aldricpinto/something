import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_URL,
})

// Attach Authorization token if present
api.interceptors.request.use((config)=>{
  const t = localStorage.getItem('manna_token')
  if(t){
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${t}`
  }
  return config
})

export async function fetchTodayVerse() {
  const { data } = await api.get('/verse/today')
  return data
}

export async function getEncouragement(mood, text) {
  const { data } = await api.post('/encouragement', { mood, text })
  return data
}

export async function listJournal(includePrivate=true) {
  const { data } = await api.get('/journal', { params: { include_private: includePrivate } })
  return data
}

export async function createJournal(entry) {
  const { data } = await api.post('/journal', entry)
  return data
}

export async function updateJournal(id, entry) {
  const { data } = await api.put(`/journal/${id}`, entry)
  return data
}

export async function deleteJournal(id) {
  const { data } = await api.delete(`/journal/${id}`)
  return data
}

export async function authWithGoogle(id_token){
  const { data } = await api.post('/auth/google', { id_token })
  return data
}

export async function askJournal(question){
  const { data } = await api.post('/journal/ask', { question })
  return data
}

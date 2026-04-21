import { useEffect } from 'react'
import Home from './pages/Home'

export default function App() {
  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (tg) {
      tg.ready()
      tg.expand()
      tg.setHeaderColor('#ffffff')
      tg.setBackgroundColor('#f9fafb')
    }
  }, [])

  return <Home />
}

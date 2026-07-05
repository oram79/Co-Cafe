import { useState, useEffect } from 'react'

export function useTheme() {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('cc_theme') === 'dark' } catch { return false }
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    try { localStorage.setItem('cc_theme', dark ? 'dark' : 'light') } catch {}
  }, [dark])

  return [dark, () => setDark(d => !d)]
}

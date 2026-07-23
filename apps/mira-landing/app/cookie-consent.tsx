'use client'
import { useEffect, useState } from 'react'

const STORAGE_KEY = 'mira_cookie_consent_v1'

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
  }, [])

  function accept() {
    localStorage.setItem(STORAGE_KEY, 'accepted')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 200,
      background: 'rgba(12,12,18,0.97)', backdropFilter: 'blur(12px)',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      padding: '16px 24px',
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
      }}>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, maxWidth: 720 }}>
          Usamos cookies esenciales y de analítica para mejorar tu experiencia. Consulta nuestra{' '}
          <a href="/cookies" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'underline' }}>
            Política de Cookies
          </a>.
        </p>
        <button onClick={accept} style={{
          flexShrink: 0, fontSize: 13, fontWeight: 700, color: '#fff', border: 'none', cursor: 'pointer',
          padding: '10px 22px', borderRadius: 10, fontFamily: 'inherit',
          background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', boxShadow: '0 0 20px rgba(124,58,237,0.35)',
        }}>
          Aceptar
        </button>
      </div>
    </div>
  )
}

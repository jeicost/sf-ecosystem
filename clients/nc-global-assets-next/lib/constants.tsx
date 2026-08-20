/**
 * El único sitio donde vive el enlace de reserva. Estaba copiado en SEIS
 * ficheros con DOS handles distintos, y los dos daban 404: el CTA principal del
 * sitio —navegación, pie, banner, cierre, intro, contacto, blog y caso de
 * éxito— no llevaba a ninguna parte y nadie se enteró (auditoría 20-ago-2026).
 * Si cambia el calendario, se cambia aquí y ya está.
 */
export const CALENDLY_URL = 'https://calendly.com/jacostech'

export const CONFIG = {
  calendlyUrl: CALENDLY_URL,
  whatsappNumber: "66825366653",
  lineId: "@ncglobalassets",
  phone: "+66825366653",
  phoneDisplay: "082 536 6653",
  email: "contact@ncglobalassets.com",
}

export const Arrow = ({ size = 14 }) => (
  <svg className="arrow" width={size} height={size} viewBox="0 0 14 14" fill="none">
    <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const Calendar = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M2 6.5h12M5 1.5v3M11 1.5v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
)

export const ChatIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
  </svg>
)

export const LinkedInIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.27c-.97 0-1.75-.78-1.75-1.73s.78-1.73 1.75-1.73 1.75.78 1.75 1.73-.78 1.73-1.75 1.73zm13.5 12.27h-3v-5.6c0-1.34-.03-3.07-1.87-3.07-1.87 0-2.16 1.46-2.16 2.97v5.7h-3v-11h2.88v1.5h.04c.4-.76 1.38-1.56 2.84-1.56 3.04 0 3.6 2 3.6 4.6v6.46z"/>
  </svg>
)

export const Eyebrow = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <span className="eyebrow" style={style}><span className="dot"></span>{children}</span>
)

export const WhatsAppIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.5 14.4c-.3-.1-1.7-.8-2-1-.3-.1-.5-.1-.6.1-.2.3-.7.9-.9 1.1-.2.1-.3.2-.6 0-1.6-.8-2.7-1.4-3.8-3.2-.3-.5.3-.5.8-1.5.1-.2 0-.3 0-.5s-.6-1.5-.9-2c-.2-.5-.5-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-.9.9-.9 2.2 0 1.3.9 2.6 1.1 2.8.1.2 1.9 2.9 4.6 4 1.7.7 2.4.8 3.2.6.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.2-.3-.3-.6-.4zM12 2C6.5 2 2 6.5 2 12c0 1.7.4 3.3 1.2 4.7L2 22l5.4-1.2c1.4.7 2.9 1.1 4.6 1.1 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18.3c-1.5 0-3-.4-4.3-1.1l-.3-.2-3.2.7.7-3.1-.2-.3c-.8-1.3-1.2-2.8-1.2-4.3 0-4.6 3.7-8.3 8.3-8.3s8.3 3.7 8.3 8.3-3.7 8.3-8.3 8.3z"/>
  </svg>
)

export const LineIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.365 9.89c.396 0 .708.32.708.71 0 .39-.312.706-.708.706h-1.962v1.257h1.962c.395 0 .708.318.708.708 0 .39-.313.71-.708.71h-2.67a.71.71 0 0 1-.706-.71V8.108a.71.71 0 0 1 .706-.708h2.67c.395 0 .708.32.708.71 0 .39-.313.708-.708.708h-1.962V9.89h1.962zm-3.96 3.39a.71.71 0 0 1-.708.71.703.703 0 0 1-.572-.286l-2.733-3.72v3.296a.71.71 0 0 1-.708.71.71.71 0 0 1-.708-.71V8.108c0-.305.197-.575.488-.673a.694.694 0 0 1 .795.247l2.745 3.72V8.108c0-.39.317-.708.713-.708.39 0 .708.318.708.708v5.172zm-6.86 0a.71.71 0 0 1-.71.71.71.71 0 0 1-.706-.71V8.108a.71.71 0 0 1 .708-.708.71.71 0 0 1 .71.708v5.172zm-2.43.71h-2.67a.71.71 0 0 1-.71-.71V8.108a.71.71 0 0 1 .71-.708.71.71 0 0 1 .71.708v4.464h1.962c.39 0 .708.317.708.708 0 .39-.317.71-.71.71M22.41 10C22.41 5.272 17.673 1.42 12 1.42 6.327 1.42 1.59 5.272 1.59 10c0 4.24 3.794 7.792 8.92 8.464.348.075.82.23.94.526.107.27.07.694.034.97l-.152.91c-.046.27-.215 1.054.923.575 1.137-.479 6.135-3.61 8.37-6.183 1.541-1.689 2.28-3.404 2.28-5.262"/>
  </svg>
)

export const MailIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2"/>
    <path d="M3 7l9 6 9-6"/>
  </svg>
)

export const getContactLinks = () => ({
  calendly: CONFIG.calendlyUrl,
  whatsapp: `https://wa.me/${CONFIG.whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent("Hi NC Global Assets, I'd like to talk about launching my brand in Thailand.")}`,
  line: `https://line.me/R/ti/p/${encodeURIComponent(CONFIG.lineId)}`,
})

/** Client-side only — dispatches the event ChatWidget listens for. */
export const openChat = () => window.dispatchEvent(new Event("nc:openchat"))

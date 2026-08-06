"use client";

import { useEffect, useState } from "react";

// Placeholder launch target — update when the real app-store date is confirmed.
// ÚNICA fuente de la fecha: el titular de AppComingSoon también lee de aquí.
// Antes el titular llevaba un "111" fijo en el CMS mientras este contador
// marcaba 104: dos números contradiciéndose en la misma pantalla.
export const LAUNCH_DATE = new Date("2026-11-18T00:00:00Z");

export function daysUntilLaunch() {
  return Math.max(0, Math.floor((LAUNCH_DATE.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

function getRemaining() {
  const diff = Math.max(0, LAUNCH_DATE.getTime() - Date.now());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

export function Countdown() {
  // Lazy initial state so the very first paint (server + client) already
  // shows a real countdown value. The number can legitimately differ by a
  // second between server render and client hydration — suppressHydrationWarning
  // below is intentional and scoped to just these text nodes.
  const [r, setRemaining] = useState(getRemaining);

  useEffect(() => {
    const id = setInterval(() => setRemaining(getRemaining()), 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="countdown" aria-label="Cuenta regresiva para el lanzamiento">
      <div className="countdown__cell">
        <span className="countdown__num" aria-live="polite" suppressHydrationWarning>
          {r.days}
        </span>
        <span className="countdown__lbl">días</span>
      </div>
      <div className="countdown__cell">
        <span className="countdown__num" aria-live="polite" suppressHydrationWarning>
          {pad(r.hours)}
        </span>
        <span className="countdown__lbl">h</span>
      </div>
      <div className="countdown__cell">
        <span className="countdown__num" aria-live="polite" suppressHydrationWarning>
          {pad(r.minutes)}
        </span>
        <span className="countdown__lbl">min</span>
      </div>
      <div className="countdown__cell">
        <span className="countdown__num" aria-live="polite" suppressHydrationWarning>
          {pad(r.seconds)}
        </span>
        <span className="countdown__lbl">seg</span>
      </div>
    </div>
  );
}

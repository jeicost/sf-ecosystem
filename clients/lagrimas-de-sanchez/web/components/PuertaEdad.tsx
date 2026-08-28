"use client";

import { useEffect, useRef, useState } from "react";

/**
 * La puerta de edad de /vino.
 *
 * Tres decisiones que no son estéticas:
 * - Nace ABIERTA y el efecto la cierra si la sesión ya pasó por aquí. Al
 *   revés (nacer cerrada y abrirse por JS), cualquier fallo de script deja
 *   la página de alcohol sin puerta — el estado seguro es el bloqueado.
 * - Es un diálogo de verdad: foco dentro al abrir, Tab atrapado, y el fondo
 *   sin scroll. Sin eso, un lector de pantalla ni se entera de que hay puerta.
 * - Se recuerda en sessionStorage, no en cookie persistente: nadie quiere un
 *   aviso de cookies para esto.
 *
 * Vive SOLO en /vino. La home vende la botella vacía, que no es alcohol, y
 * por eso puede anunciarse. Mover esta puerta a la portada cerraría ese canal.
 */
const CLAVE = "lds-edad";

export function PuertaEdad() {
  const [abierta, setAbierta] = useState(true);
  const caja = useRef<HTMLDivElement>(null);
  const botonSi = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (sessionStorage.getItem(CLAVE) === "si") {
      setAbierta(false);
      return;
    }
    botonSi.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function pasar() {
    sessionStorage.setItem(CLAVE, "si");
    document.body.style.overflow = "";
    setAbierta(false);
  }

  function atrapar(e: React.KeyboardEvent) {
    if (e.key !== "Tab") return;
    const focos = caja.current?.querySelectorAll<HTMLElement>("button, a");
    if (!focos || focos.length === 0) return;
    const primero = focos[0];
    const ultimo = focos[focos.length - 1];
    if (e.shiftKey && document.activeElement === primero) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primero.focus();
    }
  }

  if (!abierta) return null;

  return (
    <div
      ref={caja}
      role="dialog"
      aria-modal="true"
      aria-labelledby="puerta-edad-titulo"
      onKeyDown={atrapar}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/96 px-6 backdrop-blur-sm"
    >
      <div className="flex w-full max-w-md flex-col gap-7 border-2 border-ink bg-base p-8">
        <div className="flex flex-col gap-3">
          <span className="u-eyebrow">Verificación de edad</span>
          <h2 id="puerta-edad-titulo" className="u-display text-[1.9rem] leading-tight">
            ¿Tienes 18 años o más?
          </h2>
          <p className="text-[0.95rem] leading-snug text-muted">
            Esta página vende vino. Para verla tienes que ser mayor de edad.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            ref={botonSi}
            onClick={pasar}
            className="u-cond border-2 border-ink bg-ink px-6 py-4 text-[0.9rem] tracking-[0.12em] text-base transition-colors hover:bg-yellow hover:text-ink"
          >
            Sí, soy mayor de 18
          </button>
          <a
            href="/"
            className="u-cond border-2 border-line px-6 py-4 text-center text-[0.9rem] tracking-[0.12em] text-muted transition-colors hover:border-ink hover:text-ink"
          >
            No — llévame a la botella vacía
          </a>
        </div>

        <p className="u-mono text-[0.62rem] leading-relaxed text-muted">
          El consumo de alcohol es perjudicial para la salud. Bebe con moderación.
        </p>
      </div>
    </div>
  );
}

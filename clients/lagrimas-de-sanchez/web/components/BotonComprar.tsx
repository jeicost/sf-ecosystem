"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Sku } from "@/lib/catalogo";

/**
 * El botón de compra.
 *
 * No conoce precios ni monta la sesión: manda el SKU al servidor y sigue la URL
 * que devuelve. Todo lo que importa —importe, países, impuestos— se decide en
 * /api/checkout, donde el navegador no llega. Un botón que supiera el precio
 * sería un precio que se puede editar desde las herramientas de desarrollo.
 */
export function BotonComprar({
  sku,
  children,
  variante = "solido",
}: {
  sku: Sku;
  children: React.ReactNode;
  variante?: "solido" | "linea";
}) {
  const [estado, setEstado] = useState<
    "listo" | "yendo" | "error" | "agotado" | "cerrado" | "apuntando" | "apuntado"
  >("listo");
  const campo = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");

  async function comprar() {
    setEstado("yendo");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sku }),
      });
      const json = await res.json();
      if (json?.url) {
        window.location.href = json.url;
        return;
      }
      // Cada motivo se dice con sus palabras: "algo ha ido mal" no ayuda a
      // nadie a decidir qué hacer a continuación.
      if (res.status === 409) return setEstado("agotado");
      if (res.status === 503) return setEstado("cerrado");
      setEstado("error");
    } catch {
      setEstado("error");
    }
  }

  /**
   * Con la tienda aún sin abrir, el botón se convierte en lista de espera: un
   * visitante que quería comprar es exactamente el correo que no hay que
   * perder. Cuando las claves de Stripe existan, este estado no vuelve a
   * aparecer y el botón cobra.
   */
  async function apuntar(e: React.FormEvent) {
    e.preventDefault();
    setEstado("apuntando");
    try {
      const res = await fetch("/api/lista-espera", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, sku }),
      });
      setEstado(res.ok ? "apuntado" : "error");
    } catch {
      setEstado("error");
    }
  }

  const AVISOS: Record<string, string> = {
    agotado: "Se ha agotado el lote. Escríbenos y te avisamos de la próxima tirada.",
    error:
      "No ha funcionado. Inténtalo otra vez o escríbenos a hola@lagrimasdesanchez.com",
  };

  if (estado === "apuntado") {
    return (
      <div role="status" className="flex flex-col gap-2">
        <p className="u-cond border-2 border-ink bg-yellow px-5 py-4 text-[0.92rem] tracking-[0.06em] text-ink">
          Apuntado. Te avisamos cuando abra.
        </p>
        <a href="/estampado" className="u-mono inline-block py-2 text-[0.72rem] underline decoration-2 underline-offset-4 hover:text-muted">
          Mientras tanto, las 57 piezas →
        </a>
      </div>
    );
  }

  // Al cambiar el botón por el formulario el foco se quedaba en <body>: en
  // móvil el teclado no se abre y el usuario tiene que volver a tocar el
  // campo, que es justo donde se pierden los correos.
  useEffect(() => {
    if (estado === "cerrado") campo.current?.focus();
  }, [estado]);

  if (estado === "cerrado" || estado === "apuntando") {
    return (
      <form onSubmit={apuntar} className="flex flex-col gap-2">
        <p className="text-[0.82rem] leading-snug text-ink">Todavía no cobramos. Deja el correo y te avisamos cuando abramos.</p>
        <input
          type="text"
          name="_honey"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
          value=""
          onChange={() => {}}
        />
        <div className="flex">
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="tu@correo.com"
            aria-label="Tu correo para avisarte cuando abra la tienda"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            ref={campo}
            // 16 px es el umbral por debajo del cual iOS Safari AMPLÍA la
            // página al enfocar el campo, y al ampliar se descoloca todo.
            className="u-mono w-full min-w-0 border-2 border-r-0 border-ink bg-base px-4 py-3.5 text-[1rem] text-ink placeholder:text-muted"
          />
          <button
            disabled={estado === "apuntando"}
            className="u-cond shrink-0 border-2 border-ink bg-ink px-5 text-[0.85rem] tracking-[0.08em] text-base transition-colors hover:bg-yellow hover:text-ink disabled:opacity-60"
          >
            {estado === "apuntando" ? "…" : "Avisadme"}
          </button>
        </div>
        <p className="u-mono text-[0.6rem] leading-snug text-muted">
          Solo para avisarte del lanzamiento.{" "}
          <Link href="/legal" className="underline underline-offset-2">
            Cómo tratamos tus datos
          </Link>
          .
        </p>
      </form>
    );
  }

  const base =
    "u-cond inline-flex w-full items-center justify-center gap-2 border-2 border-ink px-6 py-4 text-[0.95rem] tracking-[0.1em] transition-colors duration-150 disabled:opacity-50";
  const estilo =
    variante === "solido"
      ? "bg-ink text-base hover:bg-yellow hover:text-ink"
      : "bg-base text-ink hover:bg-ink hover:text-base";

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={comprar}
        disabled={estado === "yendo" || estado === "agotado"}
        className={`${base} ${estilo}`}
      >
        {estado === "yendo" ? "Un momento…" : estado === "agotado" ? "Agotado" : children}
      </button>
      {AVISOS[estado] && (
        <p role="status" className="u-mono text-[0.7rem] leading-relaxed text-reg">
          {AVISOS[estado]}
        </p>
      )}
    </div>
  );
}

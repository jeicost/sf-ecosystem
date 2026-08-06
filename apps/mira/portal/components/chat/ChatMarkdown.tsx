'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * ─── RENDERIZADO DE MENSAJES ─────────────────────────────────────────────
 *
 * `react-markdown` llevaba en el package.json desde hace tiempo y NO se
 * importaba en ningún fichero del repo: los 8 chats pintaban el string crudo
 * con `{msg.content}`. Por eso el CEO veía "casi texto plano, todo unido" —
 * mientras los prompts de agente piden explícitamente tablas comparativas y
 * listas numeradas (lib/agent-prompts-i18n.ts).
 *
 * Se estilan los elementos a mano en vez de usar @tailwindcss/typography: el
 * plugin trae un montón de reglas pensadas para artículos largos (márgenes
 * grandes, tamaños de heading) que quedan mal dentro de una burbuja de chat, y
 * habría que sobreescribir la mitad. Con esto se controla exactamente cómo se
 * ve cada elemento y se usan los tokens semánticos del portal, así que el modo
 * claro funciona solo.
 */
export default function ChatMarkdown({ content }: { content: string }) {
  return (
    <div className="text-sm leading-relaxed break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="my-2">{children}</p>,

          strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,

          ul: ({ children }) => <ul className="my-2 space-y-1 list-disc pl-5 marker:text-ink-tertiary">{children}</ul>,
          ol: ({ children }) => <ol className="my-2 space-y-1 list-decimal pl-5 marker:text-ink-tertiary">{children}</ol>,
          li: ({ children }) => <li className="pl-0.5">{children}</li>,

          h1: ({ children }) => <h1 className="mt-4 mb-2 text-base font-semibold text-ink">{children}</h1>,
          h2: ({ children }) => <h2 className="mt-4 mb-2 text-sm font-semibold text-ink">{children}</h2>,
          h3: ({ children }) => <h3 className="mt-3 mb-1.5 text-sm font-semibold text-ink">{children}</h3>,

          // Las tablas deben poder desbordar en horizontal sin romper la
          // burbuja: los agentes devuelven comparativas de 4-5 columnas.
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-lg border border-line">
              <table className="w-full text-xs border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-surface-hover">{children}</thead>,
          th: ({ children }) => (
            <th className="px-3 py-2 text-left font-semibold text-ink border-b border-line whitespace-nowrap">{children}</th>
          ),
          td: ({ children }) => <td className="px-3 py-2 align-top border-b border-line/60">{children}</td>,

          blockquote: ({ children }) => (
            <blockquote className="my-2 border-l-2 border-line pl-3 text-ink-secondary italic">{children}</blockquote>
          ),

          code: ({ className, children }) => {
            // react-markdown v10 no pasa `inline`: un bloque de código llega
            // con className `language-*`, uno en línea no lleva ninguna.
            const isBlock = Boolean(className)
            if (isBlock) {
              return (
                <code className="block my-2 p-3 rounded-lg bg-surface border border-line text-xs font-mono overflow-x-auto whitespace-pre">
                  {children}
                </code>
              )
            }
            return <code className="px-1.5 py-0.5 rounded bg-surface-hover text-[0.85em] font-mono">{children}</code>
          },
          pre: ({ children }) => <>{children}</>,

          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 underline underline-offset-2"
            >
              {children}
            </a>
          ),

          // Esto arregla un fallo real: cuando un agente genera una imagen,
          // app/api/agent/route.ts la mete en el stream como `![...](url)`.
          // Sin renderizador de markdown el usuario veía el texto crudo con la
          // URL firmada entera — la imagen generada NO SE VEÍA NUNCA.
          img: ({ src, alt }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={typeof src === 'string' ? src : ''}
              alt={alt || ''}
              className="my-2 rounded-lg border border-line max-w-full h-auto"
              loading="lazy"
            />
          ),

          hr: () => <hr className="my-3 border-line" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

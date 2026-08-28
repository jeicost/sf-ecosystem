import Link from "next/link";

/** El 404: el único sitio donde el lagrimómetro marca el máximo con motivo. */
export default function NoEncontrada() {
  const MARCAS = ["OJO SECO", "PUCHERO", "MOQUEO", "LLORERA", "MOCO TENDIDO", "DESEMBALSE"];
  return (
    <main className="flex min-h-[70vh] items-center">
      <div className="mx-auto grid max-w-3xl gap-12 px-6 py-20 sm:grid-cols-[auto_1fr] sm:items-center">
        <div aria-hidden="true" className="relative mx-auto flex h-64 flex-col justify-between border-l-2 border-ink pl-4">
          <span className="absolute -left-[5px] top-0 h-full w-2 bg-yellow" />
          {MARCAS.map((m) => (
            <span key={m} className="u-cond flex items-center gap-2 text-[0.7rem]">
              <span className="inline-block h-[2px] w-3 bg-ink" />
              {m}
            </span>
          ))}
        </div>
        <div className="flex flex-col gap-5">
          <span className="u-eyebrow">Error 404</span>
          <h1 className="u-display text-[2.6rem] leading-[0.95] sm:text-[3.4rem]">
            Esta página
            <br />
            no existe.
          </h1>
          <p className="max-w-[36ch] text-[1.05rem] leading-relaxed text-muted">
            Un motivo más para llorar. El lagrimómetro marca desembalse, como siempre.
          </p>
          <Link
            href="/"
            className="u-cond mt-2 w-fit border-2 border-ink bg-ink px-6 py-3.5 text-[0.9rem] tracking-[0.1em] text-base transition-colors hover:bg-yellow hover:text-ink"
          >
            Volver a la portada
          </Link>
        </div>
      </div>
    </main>
  );
}

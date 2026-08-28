/**
 * Pictogramas de trabajo, compartidos.
 *
 * NO son el arte final: los definitivos los dibuja el ilustrador en SVG
 * vectorial de una tinta con trazo mínimo de 0,8 mm. Estos trazados sirven
 * para validar masas y para que la web enseñe las piezas como lo que son —
 * palabra + objeto — y no como una lista.
 *
 * Viven aquí y no dentro de la botella porque los usan dos sitios: el
 * estampado de la botella dibujada y el catálogo de /estampado.
 */

export const GLIFOS: Record<string, string> = {
  aviso: '<path d="M12 3 L22 20 L2 20Z"/><path d="M12 9.5 L12 14"/>',
  gota: '<path d="M12 2 C12 8 4 11.2 4 16 A8 8 0 0 0 20 16 C20 11.2 12 8 12 2Z" fill="currentColor" stroke="none"/>',
  sobre: '<rect x="2" y="4" width="20" height="15" rx="1.4"/><path d="M2 6 L12 13 L22 6"/>',
  tele: '<rect x="2" y="8" width="20" height="13" rx="2"/><path d="M7.4 8 L11 3 M16.6 8 L13 3"/>',
  cejas: '<path d="M2.4 12.6 C5 6.4 9.6 6.2 10.8 10.4" stroke-width="3.2"/><path d="M13.2 10.4 C14.4 6.2 19 6.4 21.6 12.6" stroke-width="3.2"/>',
  dedo: '<path d="M12 21 L12 7"/><path d="M8.4 10.6 L12 6.4 L15.6 10.6"/>',
  corona: '<path d="M3 17.6 L3 7.6 L8 11.8 L12 5 L16 11.8 L21 7.6 L21 17.6Z"/>',
  vapor: '<path d="M6 20.4 C6 16.4 9 16.4 9 12.4 C9 8.4 6 8.4 6 4.4"/><path d="M12 20.4 C12 16.4 15 16.4 15 12.4 C15 8.4 12 8.4 12 4.4"/><path d="M18 20.4 C18 17.4 20.4 17.4 20.4 14.4"/>',
  goma: '<path d="M9 19 L21 7 L17 3 L5 15 L5 19Z"/><path d="M3 19 L21 19"/>',
  urna: '<path d="M4 8.4 L20 8.4 L20 21 L4 21Z"/><path d="M8 8.4 L8 5.6 L16 5.6 L16 8.4"/><path d="M12 1.4 L12 5.2"/>',
  chirimoya: '<path d="M12 3 C18 5 21 10 19 16 C17 21 12 22 9 21 C4 19 3 13 5 9 C6.5 5.5 9 3.5 12 3Z"/><path d="M8 8 L11.5 11 M12.5 8 L16 11 M7 13.5 L10.5 16.5"/>',
  telarana: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.6"/><path d="M12 3 L12 21 M3 12 L21 12 M5.6 5.6 L18.4 18.4 M18.4 5.6 L5.6 18.4"/>',
};

/** Qué pieza del inventario lleva qué glifo (por su n). */
export const GLIFO_POR_PIEZA: Record<number, string> = {
  3: "chirimoya",
  10: "cejas",
  35: "aviso",
  36: "tele",
  37: "vapor",
  38: "corona",
  39: "dedo",
  55: "urna",
  56: "gota",
};

export function Glifo({ n, tam, grosor = 1.9 }: { n: string; tam: number; grosor?: number }) {
  return (
    <svg
      width={tam}
      height={tam}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={grosor}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: GLIFOS[n] ?? "" }}
    />
  );
}

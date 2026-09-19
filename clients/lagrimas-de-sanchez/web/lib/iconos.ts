/**
 * Qué piezas tienen ya su arte real generado, y dónde vive.
 *
 * Los ficheros son re-trazados ligeros (3-30 KB) de las generaciones aprobadas,
 * en blanco sobre transparente: sobre ámbar van tal cual, y sobre claro se
 * entintan con `filter: brightness(0)`. La numeración coincide con el
 * inventario de lib/piezas.ts (las 13 primeras de la cola van 1:1).
 */
export const ICONO_DE: Record<number, string> = {
  1: "01-galgo-de-paiporta",
  2: "02-chepas",
  3: "03-chirimoyas",
  4: "04-chiqui",
  5: "05-pili-juerga",
  6: "06-la-nina-de-la-curva",
  7: "07-catedratica",
  8: "08-gracita-bolanos",
  9: "09-el-portero",
  10: "10-cejas",
  11: "11-la-cajera",
  12: "12-tucan",
  13: "13-charo",

  // ── Pictogramas dibujados a mano (19-sep) ─────────────────────────────
  // La cola de generación IA quedó sin créditos (Magnific/Freepik, 402 en
  // los dos hosts); estos son SVG autorales en el mismo lenguaje: silueta
  // maciza #F6F1E6, detalle en negativo, margen generoso. Sirven para web
  // y retícula; el arte final de serigrafía lo cierra el ilustrador.
  14: "14-marlaskona",
  15: "15-felpudo-vi",
  17: "17-oscargutan",
  18: "18-javierito",
  32: "32-sincronizada",
  33: "33-la-banda-del-peugeot",
  34: "34-fango",
  35: "35-bulos",
  36: "36-telepedro",
  37: "37-saunas",
  38: "38-el-puto-amo",
  39: "39-el-uno",
  40: "40-falcon",
  41: "41-maquina-del-fango",
  42: "42-cabalgar-contradicciones",
  43: "43-izquierda-caviar",
  55: "55-pucherazo",
  56: "56-contiene-lagrimas",
  57: "57-edicion-numerada",
  // Falta solo el 54 (Lagrimómetro): los medidores siguen siendo decisión
  // abierta de Carlos (producto/medidores-abierto.md).

  // ── Piezas de solo texto ──────────────────────────────────────────────
  // Compuestas en vector, no generadas: con la tipografía del sistema ya
  // nacen unificadas entre sí, que es el trabajo caro de la unificación
  // posterior. Y no consumen créditos de generación.
  16: "t-hermanisimo",
  19: "t-rufian",
  20: "t-mema",
  21: "t-patxi-verguenza-ajena",
  22: "t-al-menos-no-gobierna-la-ultraderecha",
  23: "t-no-dormiria-tranquilo",
  24: "t-espana-va-como-un-cohete",
  25: "t-son-las-5-y-no-he-comido",
  26: "t-facha",
  27: "t-yo-estoy-bien",
  28: "t-por-7-votos",
  29: "t-fiscal-soplon",
  30: "t-ecologetas",
  31: "t-soy-feminista-porque-soy-socialista",
  44: "t-alma-socialista-mente-de-tiburon",
  45: "t-transversal-como-el-iva",
  46: "t-horizonte-2030-legislatura-2027",
  47: "t-compromiso-firme-hasta-nueva-orden",
  48: "t-escucha-activa-decision-tomada",
  49: "t-resiliente-o-sea-que-aguantas",
  50: "t-transparencia-total-previa-cita",
  51: "t-el-pueblo-primero-despues-de-mi",
  52: "t-cambio-de-opinion-no-de-sueldo",
  53: "t-vocacion-de-servicio-nomina-de-por-vida",
};

export const rutaIcono = (n: number): string | null =>
  ICONO_DE[n] ? `/iconos/${ICONO_DE[n]}.svg` : null;

import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { HeroEntrar } from "@/components/app/HeroEntrar";
import { VideoBajoDemanda } from "@/components/app/VideoBajoDemanda";
import type { Locale } from "@/lib/i18n";
import type { AppHomeContent } from "@/lib/content/app-home";

/**
 * El hero de la home (reescrito 19-ago-2026 con el brief del CEO).
 *
 * Reglas que lo gobiernan y conviene no deshacer sin querer:
 *
 *  · **Un solo botón primario.** Todo lo demás son enlaces de texto. El hero
 *    anterior tenía dos botones compitiendo y un tercero en la nav.
 *  · **El H1 parte por la coma y solo por la coma**, en todos los anchos. Si no
 *    cabe, el `clamp()` reduce el cuerpo — nunca se busca otro punto de salto.
 *    Por eso las dos líneas van en dos `<span>` con `display:block` y no con un
 *    `<br>` suelto ni dependiendo del ancho del contenedor.
 *  · **Los ítems 1 y 2 de la barra salen de base de datos** (`platform-stats`),
 *    nunca escritos a mano. Si la consulta falla, `applyPlatformStats` los deja
 *    con el valor del fallback y `hero_stat*_num` vacío esconde el ítem: antes
 *    que un número inventado, ninguno.
 *  · El "+" solo lo lleva el primer ítem, y su número va redondeado a la baja
 *    al centenar para que no envejezca cada día.
 */
export function Hero({ content, locale = "es" }: { content: AppHomeContent; locale?: Locale }) {
  const stats = [
    { num: content.hero_stat1_num, label: content.hero_stat1_label },
    { num: content.hero_stat2_num, label: content.hero_stat2_label },
    { num: content.hero_stat3_num, label: content.hero_stat3_label },
    { num: content.hero_stat4_num, label: content.hero_stat4_label },
  ].filter((s) => s.num && s.label);

  return (
    <header className="hero" id="main-content">
      <div className="container">
        <div className="hero__grid">
          <div>
            <Reveal delay={0}>
              <span className="eyebrow">{content.hero_eyebrow}</span>
            </Reveal>
            <Reveal delay={80}>
              {/* `--hero-fit` acota el cuerpo del H1 al ancho de la columna para
                  que la línea más larga quepa entera. Es distinto por idioma
                  porque la línea más larga lo es: "Lo mejor de las redes," (22)
                  frente a "Handpicked recommendations" (26). */}
              <h1
                className="display-xl hero__titulo"
                style={{ marginTop: 24, ["--hero-fit" as string]: locale === "en" ? "7.2cqi" : "8.8cqi" }}
              >
                <span className="hero__titulo-linea">{content.hero_title_line1}</span>
                <span className="hero__titulo-linea hero__titulo-linea--2">{content.hero_title_line2}</span>
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="hero__sub">{content.hero_sub}</p>
            </Reveal>
            <Reveal delay={220}>
              <HeroEntrar locale={locale} />
            </Reveal>
            <Reveal delay={320}>
              <div className="hero__stats">
                {stats.map((s) => (
                  <div key={s.label}>
                    <div className="stat__num">{s.num}</div>
                    <div className="stat__label">{s.label}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
          <Reveal delay={200}>
            <div className="hero__visual">
              <VideoBajoDemanda
                src="/assets/v-hero-owl.mp4"
                poster="/assets/poster-hero-owl.jpg"
                ancho={720}
                alto={900}
                etiqueta={
                  locale === "en"
                    ? "Discoolver showing plans around the city"
                    : "Discoolver mostrando planes en la ciudad"
                }
              />
              {/* El rótulo va en la esquina contraria a los recortes de imagen:
                  con la mini-tarjeta abajo-izquierda, un rótulo abajo-izquierda
                  se comía las primeras letras ("ap · abre el mapa real"). */}
              <div className="hero__visual-meta">
                <span className="hero__visual-pill">{content.hero_visual_pill}</span>
                <span className="hero__visual-title">{content.hero_visual_title}</span>
              </div>
              {/* Las dos mini-tarjetas suben a las esquinas de ARRIBA. Abajo a
                  la izquierda se comían las primeras letras del rótulo: en
                  1440 px se leía "ap · abre el mapa real". */}
              <div className="hero__mini hero__mini--bunny" aria-hidden="true">
                <Image src="/assets/img-bunny.jpg" alt="" width={140} height={180} style={{ objectFit: "cover", objectPosition: "center 20%" }} />
              </div>
              <div className="hero__mini hero__mini--fox" aria-hidden="true">
                <Image src="/assets/img-fox.jpg" alt="" width={120} height={120} style={{ objectFit: "cover", objectPosition: "center 30%" }} />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </header>
  );
}

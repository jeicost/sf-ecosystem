import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Privacidad — discoolver",
  description:
    "Qué datos recogemos en discoolver cuando pides tu invitación o envías una candidatura de creator, para qué los usamos y cómo ejercer tus derechos.",
  alternates: { canonical: "/privacidad" },
  robots: { index: true, follow: true },
};

/**
 * Política de privacidad — obligatoria: los tres formularios de esta landing
 * (invitación desde el hero, aviso de lanzamiento de la app y candidatura de
 * creator) recogen datos personales de residentes en la UE y hasta ahora el
 * sitio no tenía ninguna página legal: los tres enlaces del footer apuntaban
 * a "/". Réplica adaptada de clients/discoolver/web/app/privacidad/page.tsx,
 * con los datos que recoge ESTA web (ver EXTRA_FIELDS en api/waitlist).
 *
 * Los campos entre corchetes los tiene que completar el CEO con los datos
 * fiscales reales antes de considerarla definitiva; el resto describe el
 * tratamiento que hace el sitio HOY.
 */
export default function PrivacidadPage() {
  return (
    <>
      <Nav />
      <main className="section" style={{ paddingTop: 120 }} id="main-content">
        <div className="container" style={{ maxWidth: 760 }}>
          <span className="eyebrow">Legal</span>
          <h1 className="display-lg" style={{ marginBottom: 24 }}>
            Privacidad
          </h1>
          <p className="section__lead" style={{ marginBottom: 40 }}>
            Sin letra pequeña: esto es todo lo que hacemos con tus datos.
          </p>

          <div style={{ display: "grid", gap: 28 }}>
            <section>
              <h2 className="display-md">Quién trata tus datos</h2>
              <p>
                discoolver, con domicilio en [dirección fiscal] y NIF [NIF]. Para
                cualquier cosa relacionada con tus datos:{" "}
                <a href="mailto:hola@discoolver.com">hola@discoolver.com</a>.
              </p>
            </section>

            <section>
              <h2 className="display-md">Qué recogemos y por qué</h2>
              <p>Solo lo que nos escribes tú en un formulario de esta web:</p>
              <ul>
                <li>
                  <strong>Pedir invitación:</strong> tu email y tu ciudad, para
                  enviarte tu código de acceso.
                </li>
                <li>
                  <strong>Aviso de lanzamiento de la app:</strong> tu email, para
                  escribirte el día que salga.
                </li>
                <li>
                  <strong>Candidatura de creator:</strong> tu email, tu región, el
                  tipo de contenido que haces, tus perfiles sociales (Instagram,
                  TikTok, YouTube, web u otros) y lo que nos cuentes en el mensaje,
                  para valorar la candidatura y responderte.
                </li>
              </ul>
              <p>
                No usamos cookies de publicidad ni de seguimiento. No hacemos
                perfilado ni decisiones automatizadas.
              </p>
            </section>

            <section>
              <h2 className="display-md">Base legal</h2>
              <p>
                Tu consentimiento al enviar el formulario, y nuestro interés
                legítimo en responder a una candidatura que nos has enviado tú.
                Puedes retirarlo cuando quieras escribiéndonos.
              </p>
            </section>

            <section>
              <h2 className="display-md">Cuánto tiempo</h2>
              <p>
                Las peticiones de invitación y los avisos de lanzamiento, hasta que
                te enviemos tu acceso o nos pidas borrarte. Las candidaturas,
                mientras la colaboración esté viva o hasta que pidas borrarlas.
              </p>
            </section>

            <section>
              <h2 className="display-md">Con quién los compartimos</h2>
              <p>
                Con nadie que no sea necesario para que esto funcione: el proveedor
                que aloja la web y el que nos entrega los correos de los
                formularios. No vendemos ni cedemos tus datos a terceros.
              </p>
            </section>

            <section>
              <h2 className="display-md">Tus derechos</h2>
              <p>
                Puedes acceder, rectificar, borrar, oponerte, limitar el
                tratamiento y llevarte tus datos. Escríbenos a{" "}
                <a href="mailto:hola@discoolver.com">hola@discoolver.com</a> y lo
                resolvemos. Si algo no te cuadra, puedes reclamar ante la Agencia
                Española de Protección de Datos (aepd.es).
              </p>
            </section>

            <section>
              <h2 className="display-md">Contenido de creators</h2>
              <p>
                Cuando publicamos el contenido de un creator, sigue siendo suyo: nos
                concede una licencia no exclusiva para editarlo y publicarlo, y las
                condiciones van por escrito antes de empezar.
              </p>
            </section>
          </div>

          <p style={{ marginTop: 48 }}>
            <Link href="/" className="btn btn-ghost">
              Volver a {site.name}
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}

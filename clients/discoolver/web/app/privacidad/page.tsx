import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacidad — discoolver",
  description:
    "Qué datos recogemos en discoolver cuando pides tu ciudad o envías una candidatura de creator, para qué los usamos y cómo ejercer tus derechos.",
  alternates: { canonical: "/privacidad" },
  robots: { index: true, follow: true },
};

/**
 * Política de privacidad — obligatoria: los tres formularios del sitio
 * (aviso por destino, candidatura de creator y envío de vídeo) recogen datos
 * personales de residentes en la UE. Los campos entre corchetes los tiene que
 * completar el CEO con los datos fiscales reales antes de considerarla
 * definitiva; el contenido describe el tratamiento que hace el sitio HOY.
 */
export default function PrivacidadPage() {
  return (
    <main className="section" style={{ paddingTop: 120 }}>
      <div className="container" style={{ maxWidth: 760 }}>
        <span className="eyebrow">Legal</span>
        <h1 className="display-lg" style={{ marginBottom: 24 }}>
          Privacidad
        </h1>
        <p className="section__lead" style={{ marginBottom: 40 }}>
          Sin letra pequeña: esto es todo lo que hacemos con tus datos.
        </p>

        <div className="prose" style={{ display: "grid", gap: 28 }}>
          <section>
            <h2 className="display-sm">Quién trata tus datos</h2>
            <p>
              discoolver, con domicilio en [dirección fiscal] y NIF [NIF].
              Para cualquier cosa relacionada con tus datos:{" "}
              <a href="mailto:hola@discoolver.com">hola@discoolver.com</a>.
            </p>
          </section>

          <section>
            <h2 className="display-sm">Qué recogemos y por qué</h2>
            <p>
              Solo lo que nos escribes tú en un formulario de esta web:
            </p>
            <ul>
              <li>
                <strong>Aviso por destino:</strong> tu email y la ciudad que
                pides, para escribirte cuando esa edición exista.
              </li>
              <li>
                <strong>Candidatura de creator:</strong> nombre, email, tu
                handle, tu ciudad y un enlace a tu contenido, para valorar la
                candidatura y responderte.
              </li>
              <li>
                <strong>Envío de vídeo:</strong> los mismos datos más el enlace
                al vídeo, para que lo valore el equipo editorial.
              </li>
            </ul>
            <p>
              No usamos cookies de publicidad ni de seguimiento. No hacemos
              perfilado ni decisiones automatizadas.
            </p>
          </section>

          <section>
            <h2 className="display-sm">Base legal</h2>
            <p>
              Tu consentimiento al enviar el formulario, y nuestro interés
              legítimo en responder a una candidatura que nos has enviado tú.
              Puedes retirarlo cuando quieras escribiéndonos.
            </p>
          </section>

          <section>
            <h2 className="display-sm">Cuánto tiempo</h2>
            <p>
              Los avisos por destino, hasta que salga esa edición o nos pidas
              borrarte. Las candidaturas, mientras la colaboración esté viva o
              hasta que pidas borrarlas.
            </p>
          </section>

          <section>
            <h2 className="display-sm">Con quién los compartimos</h2>
            <p>
              Con nadie que no sea necesario para que esto funcione: el
              proveedor que aloja la web y el que nos entrega los correos de los
              formularios. No vendemos ni cedemos tus datos a terceros.
            </p>
          </section>

          <section>
            <h2 className="display-sm">Tus derechos</h2>
            <p>
              Puedes acceder, rectificar, borrar, oponerte, limitar el
              tratamiento y llevarte tus datos. Escríbenos a{" "}
              <a href="mailto:hola@discoolver.com">hola@discoolver.com</a> y lo
              resolvemos. Si algo no te cuadra, puedes reclamar ante la Agencia
              Española de Protección de Datos (aepd.es).
            </p>
          </section>

          <section>
            <h2 className="display-sm">Contenido de creators</h2>
            <p>
              Cuando publicamos una guía firmada por un creator, su contenido
              sigue siendo suyo: nos concede una licencia no exclusiva para
              editarlo y publicarlo dentro de esa guía, y las condiciones van
              por escrito antes de empezar.
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
  );
}

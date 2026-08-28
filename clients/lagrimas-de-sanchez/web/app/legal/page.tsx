import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aviso legal",
  robots: { index: false, follow: true },
};

/**
 * Los datos fiscales van marcados y NO se inventan: un aviso legal con un CIF
 * de mentira es peor que no tenerlo.
 */
export default function Legal() {
  return (
    <main>
      <section className="border-b-2 border-ink">
        <div className="mx-auto flex max-w-3xl flex-col gap-5 px-6 py-16 sm:py-24">
          <span className="u-eyebrow">Aviso legal</span>
          <h1 className="u-display text-[2.5rem] leading-[0.95] sm:text-[3.25rem]">
            Aviso legal y privacidad
          </h1>
        </div>
      </section>

      <section>
        <div className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-14 text-[1rem] leading-relaxed tracking-normal text-muted sm:py-20">
          <div className="flex flex-col gap-3">
            <h2 className="u-cond text-[1.2rem] tracking-[0.05em] text-ink">Titular</h2>
            <p className="u-mono rounded-none border border-reg/40 p-4 text-[0.78rem] leading-relaxed text-reg">
              Pendiente: razón social, NIF, domicilio y datos de contacto del titular.
              Obligatorio por la Ley 34/2002. No se rellena con datos inventados.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="u-cond text-[1.2rem] tracking-[0.05em] text-ink">Sátira</h2>
            <p>
              Lágrimas de Sánchez es una marca de humor. Las piezas del estampado son apodos,
              expresiones del vocabulario político español y objetos.{" "}
              <span className="text-ink">
                Ninguna reproduce el rostro, la voz ni la imagen de persona alguna
              </span>
              , ni pretende atribuir hechos a nadie.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="u-cond text-[1.2rem] tracking-[0.05em] text-ink">Datos personales</h2>
            <p>
              Los datos que nos das al comprar se usan solo para preparar y enviar el pedido y
              para cumplir nuestras obligaciones fiscales. El pago lo procesa Stripe: nosotros
              no vemos ni guardamos tu tarjeta. Puedes pedirnos acceso, rectificación o
              supresión escribiendo a hola@lagrimasdesanchez.com.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="u-cond text-[1.2rem] tracking-[0.05em] text-ink">Cookies</h2>
            <p>
              Esta web no usa cookies de seguimiento ni de publicidad. La verificación de edad
              se guarda en el propio navegador durante la sesión y se borra al cerrarlo.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="u-cond text-[1.2rem] tracking-[0.05em] text-ink">Alcohol</h2>
            <p>
              La venta de bebidas alcohólicas está reservada a mayores de 18 años. El consumo
              de alcohol es perjudicial para la salud: bebe con moderación.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

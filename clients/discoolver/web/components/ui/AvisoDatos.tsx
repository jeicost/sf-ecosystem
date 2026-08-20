import Link from "next/link";
import type { Locale } from "@/lib/i18n";

/**
 * El aviso de capa 1 que tiene que ir PEGADO a cada formulario.
 *
 * No basta con el enlace a la política en el pie: el art. 13 del RGPD exige
 * que quien escribe su email sepa ahí mismo quién lo trata, para qué y cómo
 * echarse atrás. El formulario de /360/demo ya lo hacía bien; los cinco
 * formularios B2C no lo tenían y por eso existe este componente — para que la
 * próxima vez que se añada uno, ponerlo cueste una línea.
 *
 * Es un texto, no una casilla: la base legal aquí es el consentimiento que se
 * presta al pulsar «enviar» con el aviso a la vista, y una casilla más no
 * mejora la información — solo añade fricción a un formulario de dos campos.
 */
export function AvisoDatos({ locale, finalidad }: { locale: Locale; finalidad?: string }) {
  const es = locale === "es";
  const href = es ? "/privacidad" : "/en/privacidad";
  const proposito = finalidad ?? (es ? "responderte" : "get back to you");

  return (
    <p className="aviso-datos">
      {es ? (
        <>
          Responsable: <strong>Discoolverworld S.L.</strong> Usamos tus datos solo para {proposito}; nunca
          los vendemos ni los cedemos. Puedes acceder a ellos, corregirlos o borrarlos cuando quieras
          escribiéndonos. <Link href={href}>Política de privacidad</Link>.
        </>
      ) : (
        <>
          Controller: <strong>Discoolverworld S.L.</strong> We use your details only to {proposito}; we never
          sell or share them. You can access, correct or delete them at any time by writing to us.{" "}
          <Link href={href}>Privacy policy</Link>.
        </>
      )}
    </p>
  );
}

/** i18n mínimo — ver el homólogo en clients/discoolver/web/lib/i18n.ts */
export type Locale = "es" | "en";

export function withLocale(path: string, locale: Locale): string {
  if (!path.startsWith("/")) return path;
  const clean = path.startsWith("/en/") ? path.slice(3) : path === "/en" ? "/" : path;
  return locale === "en" ? (clean === "/" ? "/en" : `/en${clean}`) : clean || "/";
}

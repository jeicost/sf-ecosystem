import type { Metadata } from "next";
import { locales } from "@/lib/i18n/config";
import CallReportForm from "./CallReportForm";

export const metadata: Metadata = {
  title: "SF · Informe de Call — Interno",
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default function CallReportPage() {
  return <CallReportForm />;
}

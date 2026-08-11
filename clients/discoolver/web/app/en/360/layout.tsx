import type { Metadata } from "next";
import { Brand360Shell } from "@/components/b360/Brand360Shell";

export const metadata: Metadata = {
  title: {
    default: "discoolver 360 — The platform for destinations, accommodation and agencies",
    template: "%s — discoolver 360",
  },
  icons: {
    icon: [{ url: "/assets/360/icon-512.png", sizes: "512x512", type: "image/png" }],
    apple: "/assets/360/apple-icon.png",
  },
};

export default function Brand360LayoutEn({ children }: { children: React.ReactNode }) {
  return <Brand360Shell locale="en">{children}</Brand360Shell>;
}

import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Thank you — Discoolver",
  description: "Your order is confirmed.",
  path: "/en/gracias",
  locale: "en",
  noindex: true,
});

export default function Thanks() {
  return (
    <>
      <Nav locale="en" />
      <main>
        <section className="section" style={{ minHeight: "55vh", display: "flex", alignItems: "center" }}>
          <div className="container" style={{ maxWidth: 720 }}>
            <span className="eyebrow">Order confirmed</span>
            <h1 className="display-lg" style={{ margin: "16px 0 20px" }}>
              Your guide is <span style={{ color: "var(--primary)" }}>on its way.</span>
            </h1>
            <p className="section__lead" style={{ maxWidth: "58ch" }}>
              We’ve emailed you the receipt. The digital edition lands in that same inbox within
              minutes; if you ordered print, we print on demand and it ships in 5-8 working days
              with tracking.
            </p>
            <p className="section__lead" style={{ maxWidth: "58ch" }}>
              Anything odd? Write to{" "}
              <a href="mailto:hello@discoolver.com" style={{ color: "var(--primary-2)" }}>
                hello@discoolver.com
              </a>{" "}
              and we’ll sort it.
            </p>
            <Link href="/en" className="btn btn-primary" style={{ marginTop: 12 }}>
              Back to the shop
            </Link>
          </div>
        </section>
      </main>
      <Footer locale="en" />
    </>
  );
}

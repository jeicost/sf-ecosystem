"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

const socials = [
  {
    href: "https://facebook.com/salsaburgers",
    label: "Facebook",
    svg: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    href: "https://twitter.com/salsaburgers",
    label: "Twitter / X",
    svg: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    href: "https://instagram.com/salsaburgers",
    label: "Instagram",
    svg: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    ),
  },
  {
    href: "https://www.tiktok.com/@salsaburgers",
    label: "TikTok",
    svg: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.93a8.28 8.28 0 0 0 4.83 1.55V7.04a4.85 4.85 0 0 1-1.07-.35z" />
      </svg>
    ),
  },
  {
    href: "https://linkedin.com/company/salsaburgers",
    label: "LinkedIn",
    svg: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
];

export function Footer() {
  const { t } = useLanguage();

  const navLinks = [
    { label: t.footer.links.menu, href: "#menu" },
    { label: t.footer.links.order, href: "#order" },
    { label: t.footer.links.sauces, href: "#sauces" },
    { label: t.footer.links.about, href: "/about" },
    { label: t.footer.links.contact, href: "/contact" },
  ];

  const scrollTo = (href: string) => {
    if (href.startsWith("#")) {
      const el = document.getElementById(href.slice(1));
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="relative bg-black text-white overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, white 2px, transparent 0)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-14">
        <div className="flex flex-col lg:flex-row items-start gap-12 lg:gap-16">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Link href="/" className="group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/salsa-logo.png"
                alt="Salsa Burgers"
                loading="lazy"
                className="h-12 w-auto brightness-0 invert group-hover:opacity-80 transition-opacity"
              />
            </Link>
          </motion.div>

          {/* Navigation */}
          <motion.nav
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex-1 space-y-2"
          >
            {navLinks.map((link) =>
              link.href.startsWith("#") ? (
                <button
                  key={link.label}
                  onClick={() => scrollTo(link.href)}
                  className="block text-white hover:text-[#ff0000] transition-colors text-lg sm:text-xl font-black uppercase tracking-tight text-left"
                >
                  {link.label}
                </button>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  className="block text-white hover:text-[#ff0000] transition-colors text-lg sm:text-xl font-black uppercase tracking-tight"
                >
                  {link.label}
                </Link>
              )
            )}
          </motion.nav>
        </div>

        {/* Social icons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex items-center gap-4 mt-12"
        >
          {socials.map(({ href, label, svg }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-[#ff0000] transition-colors"
            >
              {svg}
            </a>
          ))}
          {/* Google Maps / GMB */}
          <a
            href="https://share.google/KVPeeLwzkCktUd8US"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Find us on Google Maps"
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-[#ff0000] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </a>
        </motion.div>
      </div>

      {/* Scrolling "DIP HAPPENS" text */}
      <div className="relative py-10 overflow-hidden border-t border-white/10">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="flex whitespace-nowrap"
        >
          {[0, 1].map((n) => (
            <span
              key={n}
              className="text-[4rem] sm:text-[6rem] md:text-[8rem] lg:text-[10rem] xl:text-[12rem] font-black text-transparent leading-none tracking-[-0.05em] pr-12"
              style={{ WebkitTextStroke: "2px white" }}
            >
              DIP HAPPENS • DIP HAPPENS • DIP HAPPENS •{" "}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Copyright bar */}
      <div className="relative border-t border-white/10 py-6">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-bold uppercase tracking-wide">
            <div className="text-white/60">{t.footer.copy}</div>
            <span className="w-3 h-3 rounded-full bg-[#ff0000] inline-block" />
          </div>
        </div>
      </div>
    </footer>
  );
}

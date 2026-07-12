"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useOrder } from "@/context/OrderContext";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useLanguage();
  const { openOrder } = useOrder();

  const navLinks = [
    { label: t.nav.about, href: "/about" },
    { label: t.nav.menu, href: "/menu" },
    { label: "Blog", href: "/blog" },
    { label: t.nav.contact, href: "/contact" },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (href: string) => {
    setMobileOpen(false);
    if (href.startsWith("#")) {
      const el = document.getElementById(href.slice(1));
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-black/90 backdrop-blur-xl border-b border-white/10"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="group flex-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/salsa-logo.png"
              alt="Salsa Burgers"
              className="h-24 w-auto group-hover:opacity-80 transition-opacity"
            />
          </Link>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return link.href.startsWith("#") ? (
                <button
                  key={link.label}
                  onClick={() => scrollTo(link.href)}
                  className="text-sm font-black uppercase tracking-wider transition-colors"
                  style={{ color: isActive ? "#ff0000" : "rgba(255,255,255,0.8)" }}
                >
                  {link.label}
                </button>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm font-black uppercase tracking-wider transition-colors hover:text-white"
                  style={{ color: isActive ? "#ff0000" : "rgba(255,255,255,0.8)" }}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            <button
              onClick={openOrder}
              className="flex text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #f01a00, #af1200)" }}
            >
              {t.nav.orderNow}
            </button>

            <button
              className="lg:hidden text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center gap-8"
          >
            {navLinks.map((link, i) => {
              const isActive = pathname === link.href;
              return link.href.startsWith("#") ? (
                <motion.button
                  key={link.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  onClick={() => scrollTo(link.href)}
                  className="text-4xl font-black uppercase tracking-tighter transition-colors"
                  style={{ color: isActive ? "#ff0000" : "white" }}
                >
                  {link.label}
                </motion.button>
              ) : (
                <motion.div
                  key={link.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="text-4xl font-black uppercase tracking-tighter transition-colors hover:text-[#ff0000]"
                    style={{ color: isActive ? "#ff0000" : "white" }}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              );
            })}

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (navLinks.length + 1) * 0.07 }}
              onClick={() => { openOrder(); setMobileOpen(false); }}
              className="mt-4 bg-[#ff0000] text-white px-10 py-4 rounded-full text-lg font-black uppercase tracking-wider"
            >
              {t.nav.orderNow}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

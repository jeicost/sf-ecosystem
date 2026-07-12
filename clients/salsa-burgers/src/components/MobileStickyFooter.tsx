"use client";

import { motion } from "motion/react";
import { useLanguage } from "@/context/LanguageContext";

export function MobileStickyFooter() {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#2c2c2c]/95 backdrop-blur-xl border-t border-white/10"
    >
      <div className="px-4 py-3">
        <div className="flex gap-3">
          <button
            onClick={() => window.open("https://r.grab.com/o/UJnMJVre", "_blank")}
            className="flex-1 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider active:scale-95 transition-transform flex items-center justify-center gap-2"
            style={{ backgroundColor: "#00B14F", boxShadow: "0 4px 20px rgba(0,177,79,0.35)" }}
          >
            <span className="w-6 h-6 rounded-lg flex items-center justify-center flex-none" style={{ backgroundColor: "rgba(0,0,0,0.2)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </span>
            GRAB
          </button>
          <button
            onClick={() => window.open("https://lin.ee/rIpXvGI?openExternalBrowser=1", "_blank")}
            className="flex-1 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider active:scale-95 transition-transform flex items-center justify-center gap-2"
            style={{ backgroundColor: "#00B900", boxShadow: "0 4px 20px rgba(0,185,0,0.35)" }}
          >
            <span className="w-6 h-6 rounded-lg flex items-center justify-center flex-none" style={{ backgroundColor: "rgba(0,0,0,0.2)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
              </svg>
            </span>
            LINE MAN
          </button>
        </div>
      </div>
    </motion.div>
  );
}

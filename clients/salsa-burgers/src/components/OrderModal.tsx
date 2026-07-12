"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { useOrder } from "@/context/OrderContext";
import { useLanguage } from "@/context/LanguageContext";

const GRAB_URL = "https://r.grab.com/o/UJnMJVre";
const LINE_URL  = "https://lin.ee/rIpXvGI?openExternalBrowser=1";

export function OrderModal() {
  const { isOpen, closeOrder } = useOrder();
  const { t } = useLanguage();

  const handleGrab = () => { window.open(GRAB_URL, "_blank"); closeOrder(); };
  const handleLine = () => { window.open(LINE_URL,  "_blank"); closeOrder(); };

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else         document.body.style.overflow = "";
    return ()  => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md"
            onClick={closeOrder}
          />

          {/* Mobile: bottom sheet — Desktop: centered modal */}
          <div className="fixed inset-0 z-[61] flex flex-col justify-end sm:items-center sm:justify-center sm:p-8 pointer-events-none">
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto w-full sm:max-w-2xl"
            >
              {/* Card */}
              <div
                className="rounded-t-3xl sm:rounded-3xl overflow-hidden border border-white/10 max-h-[92dvh] flex flex-col"
                style={{ backgroundColor: "#111111" }}
              >
                {/* Drag handle — mobile only */}
                <div className="flex justify-center pt-3 pb-1 sm:hidden flex-none">
                  <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>

                {/* Sticky header with close button */}
                <div className="relative px-6 sm:px-8 pt-4 sm:pt-8 pb-5 text-center border-b border-white/10 flex-none">
                  <button
                    onClick={closeOrder}
                    className="absolute top-3 right-4 sm:top-5 sm:right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>

                  <div className="inline-flex items-center gap-2 mb-2 sm:mb-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/salsa-logo.png" alt="Salsa Burgers" loading="lazy" className="h-8 sm:h-10 w-auto" />
                  </div>

                  <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter text-white">
                    {t.nav.orderNow}
                  </h2>
                  <p className="text-white/50 text-sm font-medium mt-1 sm:mt-2">
                    {t.delivery.sub}
                  </p>
                </div>

                {/* Scrollable content */}
                <div className="overflow-y-auto flex-1">
                  {/* Platform cards — stacked on mobile, side-by-side on desktop */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
                    {/* Grab */}
                    <motion.button
                      onClick={handleGrab}
                      whileTap={{ scale: 0.98 }}
                      className="group relative flex flex-col items-center gap-4 sm:gap-5 p-6 sm:p-10 text-white transition-colors border-b sm:border-b-0 sm:border-r border-white/10 hover:bg-white/5 active:bg-white/5"
                    >
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(240,26,0,0.10) 0%, transparent 70%)" }}
                      />
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shadow-2xl" style={{ backgroundColor: "#00B14F" }}>
                        <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                      </div>
                      <div className="text-center">
                        <p className="text-xl sm:text-2xl font-black uppercase tracking-tight">Grab</p>
                        <p className="text-white/50 text-sm mt-1">{t.delivery.features[0].sub}</p>
                      </div>
                      <div className="w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider text-white text-center"
                        style={{ background: "linear-gradient(135deg, #f01a00, #af1200)" }}>
                        {t.delivery.orderGrab}
                      </div>
                    </motion.button>

                    {/* LINE MAN */}
                    <motion.button
                      onClick={handleLine}
                      whileTap={{ scale: 0.98 }}
                      className="group relative flex flex-col items-center gap-4 sm:gap-5 p-6 sm:p-10 text-white transition-colors hover:bg-white/5 active:bg-white/5"
                    >
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(240,26,0,0.10) 0%, transparent 70%)" }}
                      />
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shadow-2xl" style={{ backgroundColor: "#00B900" }}>
                        <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                        </svg>
                      </div>
                      <div className="text-center">
                        <p className="text-xl sm:text-2xl font-black uppercase tracking-tight">LINE MAN</p>
                        <p className="text-white/50 text-sm mt-1">{t.delivery.features[0].sub}</p>
                      </div>
                      <div className="w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider text-white text-center"
                        style={{ background: "linear-gradient(135deg, #f01a00, #af1200)" }}>
                        {t.delivery.orderLine}
                      </div>
                    </motion.button>
                  </div>

                  {/* Footer */}
                  <div className="px-6 sm:px-8 py-4 text-center border-t border-white/10">
                    <p className="text-white/30 text-xs font-medium">
                      {t.delivery.features[1].sub} · {t.delivery.features[0].sub}
                    </p>
                  </div>
                </div>
              </div>

              {/* Mobile: tap outside hint */}
              <p className="text-center text-white/20 text-xs font-medium pt-3 pb-2 sm:hidden">
                Tap outside to close
              </p>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

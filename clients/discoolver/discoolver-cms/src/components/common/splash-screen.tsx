"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

interface SplashScreenProps {
  isVisible: boolean;
}

/**
 * Splash screen component that displays while the app is loading
 * Shows the Discoolver logo with pulse animation and a spinner
 */
export function SplashScreen({ isVisible }: SplashScreenProps) {
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-background transition-opacity duration-300",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <div className="relative w-20 h-20 animate-pulse">
        <Image
          src="/logo.svg"
          alt="Discoolver Logo"
          fill
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
}

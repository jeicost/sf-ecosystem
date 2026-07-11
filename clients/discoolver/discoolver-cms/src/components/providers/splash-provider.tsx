"use client";

import { SplashScreen } from "@/components/common/splash-screen";
import { useEffect, useState } from "react";

interface SplashProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that manages the splash screen visibility
 * Shows splash screen on initial load and hides it once the app is ready
 */
export function SplashProvider({ children }: SplashProviderProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait for the app to be fully loaded
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Minimum display time of 1 second

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <SplashScreen isVisible={isLoading} />
      <div
        className={
          isLoading
            ? "opacity-0"
            : "opacity-100 transition-opacity duration-300"
        }
      >
        {children}
      </div>
    </>
  );
}

"use client";

import { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    // 1. Check initial status safely
    setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);

    // 2. What happens when the internet comes back
    const handleOnline = () => {
      setIsOnline(true);
      setShowRestored(true);

      // Hide the "Connection restored!" message after 3 seconds
      setTimeout(() => {
        setShowRestored(false);
      }, 3000);
    };

    // 3. What happens when the internet drops
    const handleOffline = () => {
      setIsOnline(false);
      setShowRestored(false); // Instantly hide the success message if it was showing
    };

    // 4. Attach the listeners to the browser window
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Cleanup listeners when component unmounts
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // If everything is fine, render absolutely nothing!
  if (isOnline && !showRestored) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-9999 animate-in slide-in-from-bottom-6 fade-in duration-500">
      <div
        className={cn(
          "flex items-center gap-2.5 px-5 py-3 rounded-full shadow-2xl border text-[11px] uppercase tracking-widest font-black backdrop-blur-md transition-all duration-500",
          !isOnline
            ? "bg-red-600/95 text-white border-red-500/50 shadow-red-500/20" // Offline Design
            : "bg-emerald-600/95 text-white border-emerald-500/50 shadow-emerald-500/20", // Back Online Design
        )}
      >
        {!isOnline ? (
          <>
            <WifiOff className="w-4 h-4 animate-pulse" />
            No Internet Connection
          </>
        ) : (
          <>
            <Wifi className="w-4 h-4" />
            Connection Restored
          </>
        )}
      </div>
    </div>
  );
}

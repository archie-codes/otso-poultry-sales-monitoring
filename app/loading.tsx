import { MapPin } from "lucide-react";
import Image from "next/image";

export default function Loading() {
  return (
    <div className="min-h-[70vh] w-full flex flex-col items-center justify-center p-6 text-center">
      <style>{`
        @keyframes chicken-bob {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-5px) rotate(2deg); }
        }
        @keyframes left-leg-walk {
          0%, 100% { transform: rotate(15deg); }
          50% { transform: rotate(-25deg); }
        }
        @keyframes right-leg-walk {
          0%, 100% { transform: rotate(-25deg); }
          50% { transform: rotate(15deg); }
        }
      `}</style>

      <div className="flex flex-col items-center gap-5 animate-in fade-in duration-500 relative">
        {/* The Walking Chicken */}
        <div
          className="relative text-blue-600 drop-shadow-lg"
          style={{ animation: "chicken-bob 0.7s infinite ease-in-out" }}
        >
          <svg viewBox="0 0 100 100" className="w-24 h-24" fill="currentColor">
            {/* Body */}
            <path d="M78 45C78 62 64.5 76 48 76C31.5 76 18 62 18 45C18 28 31.5 14 48 14C64.5 14 78 28 78 45Z" />
            {/* Beak */}
            <path d="M88 43L78 48L78 38L88 43Z" className="text-amber-500" />
            {/* Eye */}
            <circle cx="68" cy="38" r="4" className="text-white" />
            <circle cx="70" cy="38" r="1.5" className="text-slate-900" />
            {/* Comb */}
            <path
              d="M55 8C55 8 58 2 63 4C68 6 64 12 64 12C64 12 70 10 72 13C74 16 68 20 68 20"
              className="text-red-500"
            />
            {/* Wattle */}
            <path
              d="M75 50C75 50 78 55 75 58C72 61 70 56 70 56"
              className="text-red-600"
            />
            {/* Wing */}
            <path
              d="M48 65C58 65 65 57 65 48C65 39 58 31 48 31"
              className="text-blue-700/80"
            />

            {/* Left Leg */}
            <g
              style={{
                animation: "left-leg-walk 0.7s infinite ease-in-out",
                transformOrigin: "48px 76px",
              }}
            >
              <rect
                x="45"
                y="76"
                width="6"
                height="16"
                className="text-amber-500"
                rx="2"
              />
              <rect
                x="41"
                y="88"
                width="14"
                height="4"
                className="text-amber-600"
                rx="2"
              />
            </g>

            {/* Right Leg */}
            <g
              style={{
                animation: "right-leg-walk 0.7s infinite ease-in-out",
                transformOrigin: "51px 76px",
              }}
            >
              <rect
                x="49"
                y="76"
                width="6"
                height="16"
                className="text-amber-500"
                rx="2"
              />
              <rect
                x="45"
                y="88"
                width="14"
                height="4"
                className="text-amber-600"
                rx="2"
              />
            </g>
          </svg>

          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-2 bg-blue-100 dark:bg-blue-900/30 rounded-full blur-md opacity-70 -z-10"></div>
        </div>

        {/* Minimalist Loading Text */}
        <div className="flex items-center gap-1.5 opacity-70">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground animate-pulse">
            Loading
          </span>
          {/* Three tiny bouncing dots */}
          <span className="flex gap-0.5 pt-0.5">
            <span
              className="w-1 h-1 rounded-full bg-muted-foreground animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></span>
            <span
              className="w-1 h-1 rounded-full bg-muted-foreground animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></span>
            <span
              className="w-1 h-1 rounded-full bg-muted-foreground animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></span>
          </span>
        </div>
      </div>
    </div>
  );
}

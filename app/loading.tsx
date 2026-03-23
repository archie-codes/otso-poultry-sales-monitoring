import Image from "next/image";

export default function Loading() {
  return (
    <div className="min-h-[80vh] w-full flex flex-col items-center justify-center p-6 text-center bg-background/50 backdrop-blur-sm">
      <style>{`
        @keyframes hen-bob {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          50% { transform: translateY(-12px) rotate(1deg); }
        }
        @keyframes shadow-pulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(0.8); opacity: 0.1; }
        }
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      <div className="flex flex-col items-center animate-in fade-in duration-700">
        {/* MASCOT CONTAINER */}
        <div className="relative mb-3">
          {/* THE HEN SVG MASCOT */}
          <div
            className="relative z-10"
            style={{ animation: "hen-bob 2s infinite ease-in-out" }}
          >
            <Image
              src="/hen.svg" // <-- Now using the SVG version
              alt="Otso Poultry Mascot"
              width={70}
              height={70}
              className="drop-shadow-xl dark:invert"
              priority
            />
          </div>

          {/* SOFT SHADOW PULSE */}
          <div
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-20 h-3 bg-foreground/10 rounded-[100%] blur-md"
            style={{ animation: "shadow-pulse 2s infinite ease-in-out" }}
          ></div>
        </div>

        {/* LOADING TEXT & DOTS */}
        <div className="space-y-3">
          <h3 className="text-sm font-black uppercase tracking-[0.3em] text-foreground/80 flex items-center justify-center gap-1">
            Loading
            <span className="flex gap-1 ml-1 pt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce"></span>
            </span>
          </h3>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
            Fetching Poultry Records
          </p>
        </div>

        {/* PREMIUM AMBER SHIMMER BAR */}
        <div className="mt-8 w-48 h-1 bg-muted rounded-full overflow-hidden relative border border-border/20">
          <div
            className="absolute inset-0 bg-linear-to-r from-transparent via-amber-500/50 to-transparent"
            style={{
              animation: "loading-bar 1.5s infinite linear",
              width: "100%",
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}

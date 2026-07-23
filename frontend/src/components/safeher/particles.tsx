export function Particles({ count = 24 }: { count?: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => {
        const size = 2 + Math.random() * 4;
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const delay = -Math.random() * 8;
        return (
          <span
            key={i}
            className="absolute rounded-full bg-white/70 animate-float-slow"
            style={{
              width: size,
              height: size,
              left: `${left}%`,
              top: `${top}%`,
              animationDelay: `${delay}s`,
              boxShadow: "0 0 12px rgba(255,255,255,0.7)",
              opacity: 0.4 + Math.random() * 0.5,
            }}
          />
        );
      })}
    </div>
  );
}
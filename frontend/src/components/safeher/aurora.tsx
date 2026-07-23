export function Aurora() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 aurora-bg" />
      <div className="absolute -left-24 top-32 h-72 w-72 rounded-full bg-primary/20 blur-3xl animate-float-slow" />
      <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-accent/20 blur-3xl animate-float-slow" style={{ animationDelay: "-3s" }} />
      <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-primary/15 blur-3xl animate-float-slow" style={{ animationDelay: "-5s" }} />
    </div>
  );
}
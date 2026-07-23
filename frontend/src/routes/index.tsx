import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Sparkles, ShieldCheck, MapPin, Mic, Car, Bot, Play, ArrowRight } from "lucide-react";
// hero image removed per request
import { BrandLogo } from "@/components/safeher/brand";
import { GlassCard } from "@/components/safeher/glass-card";
import { GradientButton } from "@/components/safeher/gradient-button";
import { Aurora } from "@/components/safeher/aurora";
import { Particles } from "@/components/safeher/particles";
import { ThemeToggle } from "@/components/safeher/theme-toggle";

export const Route = createFileRoute("/")({ component: Landing });

const features = [
  { icon: ShieldCheck, title: "Guardian Mode", desc: "AI watches your journey and reacts to danger in real time." },
  { icon: Mic, title: "Voice Guardian", desc: "Say your secret word — SafeHer listens and springs into action." },
  { icon: MapPin, title: "Safe Routes", desc: "AI ranks routes by crime, crowd, lighting and weather." },
  { icon: Car, title: "Ride Guardian", desc: "Live cab tracking with automatic route-deviation alerts." },
  { icon: Bot, title: "AI Assistant", desc: "24/7 companion for legal help, self defence and calming support." },
  { icon: Sparkles, title: "Daily Empowerment", desc: "Affirmations, stories and self-defence lessons every day." },
];

const safetyFactors = [
  { label: 'Emergency Contacts', score: 25, active: true },
  { label: 'Live Location', score: 25, active: true },
  { label: 'Voice Guardian', score: 25, active: true },
  { label: 'Network Connected', score: 25, active: navigator.onLine },
  { label: 'App Not In Use', score: -50, active: true },
];

function Landing() {
  const calculatedScore = safetyFactors.reduce(
    (total, item) => total + (item.active ? item.score : 0),
    0
  );

  const safetyStatus =
    calculatedScore >= 90
      ? 'Protected'
      : calculatedScore >= 70
        ? 'Stay Alert'
        : 'High Risk';

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Aurora />
      <Particles count={30} />

      {/* Nav */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <BrandLogo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/login" className="hidden rounded-full px-4 py-2 text-sm font-semibold text-foreground/80 hover:text-foreground sm:inline">
            Sign in
          </Link>
          <Link to="/login">
            <GradientButton className="px-5 py-2.5 text-sm">Open App</GradientButton>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 px-5 pb-16 pt-6 lg:grid-cols-2 lg:gap-12 lg:pt-14">
        <div className="text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-semibold text-foreground/80 shadow-soft">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI-powered women safety, reimagined
          </span>
          <h1 className="mt-5 font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            Your <span className="gradient-brand-text">AI Safety</span>
            <br />Companion
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-base text-muted-foreground sm:text-lg lg:mx-0">
            Real-time AI protection with Voice Guardian, Safe Routes, Live Location Sharing, Emergency SOS and intelligent safety insights — all in one powerful companion.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Link to="/login">
              <GradientButton className="px-7 py-3.5">
                Get Started <ArrowRight className="h-4 w-4" />
              </GradientButton>
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground lg:justify-start">
            <Stat value="24×7" label="AI Protection" />
            <Stat value="1 Sec" label="Live Tracking" />
            <Stat value="Instant" label="SOS Response" />
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <div className="absolute -inset-6 rounded-[3rem] gradient-brand opacity-20 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2.5rem] glass shadow-glow">
            <div className="absolute inset-0 aurora-bg opacity-70" />
            <div className="relative z-10 flex flex-col min-h-[430px] w-full items-stretch justify-between p-7 pb-6 text-white">
              <div className="mb-4">
                <h2 className="text-left font-semibold text-lg mb-1">AI Protection Active</h2>
                <p className="text-left text-xs text-muted-foreground mb-4">Your safety is continuously monitored in real time.</p>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium flex items-center gap-1">
                    <span className="text-green-400 text-base">🟢</span> Voice Guardian
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium flex items-center gap-1">
                    <span className="text-primary">📍</span> Live Tracking
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium flex items-center gap-1">
                    <span className="text-red-400">🚨</span> SOS Ready
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium flex items-center gap-1">
                    <span className="text-green-400">👥</span> Trusted Contacts
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-6 items-start w-full">
                <div className="flex flex-col justify-center">
                  <div className="text-xs text-muted-foreground mb-0.5">AI Safety Index</div>
                  <div className="text-4xl font-bold gradient-brand-text">{calculatedScore}/100</div>
                  <div className="inline-block rounded-full bg-green-600/20 px-3 py-1 text-xs font-semibold text-green-400 self-start mt-1 w-fit">{safetyStatus}</div>
                </div>
                <div>
                  <div className="rounded-xl bg-white/5 p-4">
                    {safetyFactors.map((factor) => (
                      <div key={factor.label} className="flex items-center justify-between border-b border-white/10 py-2 last:border-0">
                        <span>{factor.label}</span>
                        <span className={factor.active ? (factor.score < 0 ? "text-red-400 font-semibold" : "text-green-400 font-semibold") : "text-green-400 font-semibold"}>
                          {factor.active
                            ? `${factor.score}`
                            : `${factor.score < 0 ? factor.score : 0}`}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-white/10 mt-4 pt-4 flex justify-between font-semibold text-white">
                    <span>Overall Score</span>
                    <span className="text-2xl gradient-brand-text">{calculatedScore}/100</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-24">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Everything you need to stay safe</h2>
          <p className="mt-3 text-muted-foreground">A quiet, powerful AI companion — always alert, never in the way.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <GlassCard key={f.title} className="group hover:-translate-y-1 transition-transform" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl gradient-brand text-white shadow-glow">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-4xl px-5 pb-24">
        <div className="relative overflow-hidden rounded-[2.5rem] gradient-brand p-10 text-center text-white shadow-glow">
          <Particles count={16} />
          <h2 className="relative z-10 font-display text-3xl font-bold sm:text-4xl">Step out with confidence.</h2>
          <p className="relative z-10 mx-auto mt-3 max-w-lg text-white/85">Join millions of women who trust SafeHer AI as their invisible guardian.</p>
          <Link to="/login" className="relative z-10 mt-6 inline-flex">
            <button className="rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-primary shadow-soft transition-transform active:scale-95">
              Get Started Free
            </button>
          </Link>
        </div>
      </section>

      <footer className="relative z-10 mx-auto max-w-6xl px-5 pb-10 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} SafeHer AI · Built with care for every woman, everywhere.
      </footer>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-left">
      <div className="font-display text-xl font-bold text-foreground">{value}</div>
      <div>{label}</div>
    </div>
  );
}

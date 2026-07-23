import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/safeher/brand";
import { GlassCard } from "@/components/safeher/glass-card";
import { GradientButton } from "@/components/safeher/gradient-button";
import { Aurora } from "@/components/safeher/aurora";
import { Particles } from "@/components/safeher/particles";
import { guardianApi, saveGuardianSession } from "@/lib/guardianApi";

export const Route = createFileRoute("/guardian/login")({
  head: () => ({ meta: [{ title: "Guardian Login — SafeHer AI" }] }),
  component: GuardianLoginPage,
});

function GuardianLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Please enter the email address you were added with.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await guardianApi.login(email.trim());
      saveGuardianSession({ token: response.data.token, guardian: response.data.guardian });
      navigate({ to: "/guardian/dashboard" });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We couldn't verify that email. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Aurora />
      <Particles count={20} />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
        <div className="absolute left-1/2 top-10 -translate-x-1/2">
          <BrandLogo size={42} />
        </div>

        <GlassCard className="rounded-[32px] border border-white/20 bg-white/70 p-10 shadow-2xl backdrop-blur-2xl">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full gradient-brand shadow-glow">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>

          <h1 className="text-center text-3xl font-extrabold tracking-tight">Guardian Login</h1>
          <p className="mx-auto mt-3 max-w-sm text-center text-base leading-6 text-muted-foreground">
            Enter the email address a SafeHer AI user added you with, and you'll be able to see
            their live location and safety status.
          </p>

          {error ? (
            <div className="mt-6 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-600">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="guardian-email" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                Email address
              </label>
              <input
                id="guardian-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-white/20 bg-white/60 px-4 py-3 text-sm outline-none ring-primary/40 transition focus:ring-2"
                disabled={isSubmitting}
              />
            </div>

            <GradientButton type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Checking..." : "Continue as Guardian"}
            </GradientButton>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}

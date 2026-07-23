import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandLogo({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className="grid place-items-center rounded-2xl gradient-brand shadow-glow"
        style={{ width: size, height: size }}
      >
        <Shield className="text-white" style={{ width: size * 0.55, height: size * 0.55 }} strokeWidth={2.5} />
      </div>
      <span className="font-display text-lg font-bold tracking-tight">
        SafeHer<span className="gradient-brand-text"> AI</span>
      </span>
    </div>
  );
}
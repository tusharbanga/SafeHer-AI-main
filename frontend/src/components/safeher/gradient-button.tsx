import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "solid" | "outline" | "ghost" };

export const GradientButton = forwardRef<HTMLButtonElement, Props>(function GradientButton(
  { className, variant = "solid", ...props },
  ref,
) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50";
  const styles =
    variant === "solid"
      ? "gradient-brand text-white shadow-glow hover:shadow-pink-glow"
      : variant === "outline"
        ? "border border-primary/40 text-foreground hover:bg-primary/5"
        : "text-foreground hover:bg-muted";
  return <button ref={ref} className={cn(base, styles, className)} {...props} />;
});
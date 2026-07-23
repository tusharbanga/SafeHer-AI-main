import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export function GlassCard({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("glass rounded-3xl p-5 shadow-soft", className)} {...props} />;
}
import type { ReactNode } from "react";
import { Aurora } from "./aurora";

export function ScreenShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <Aurora />
      <div className="mx-auto max-w-md px-5 pb-32 pt-8">{children}</div>
    </div>
  );
}
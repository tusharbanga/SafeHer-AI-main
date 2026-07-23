import { Link, useRouterState } from "@tanstack/react-router";
import { Home, MapPin, Bot, Shield, User } from "lucide-react";

type Item = { to: string; label: string; icon: typeof Home; exact?: boolean; primary?: boolean };
const items: Item[] = [
  { to: "/app", label: "Home", icon: Home, exact: true },
  { to: "/app/heatmap", label: "Map", icon: MapPin },
  { to: "/app/sos", label: "SOS", icon: Shield, primary: true },
  { to: "/app/assistant", label: "AI", icon: Bot },
  { to: "/app/profile", label: "Me", icon: User },
];

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-4 z-40 mx-auto flex max-w-md items-center justify-around gap-1 rounded-full glass px-3 py-2 shadow-soft">
      {items.map((it) => {
        const Icon = it.icon;
        const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
        if (it.primary) {
          return (
            <Link key={it.to} to={it.to as "/app"} className="grid h-14 w-14 -translate-y-4 place-items-center rounded-full gradient-brand text-white shadow-glow">
              <Icon className="h-6 w-6" />
            </Link>
          );
        }
        return (
          <Link
            key={it.to}
            to={it.to as "/app"}
            className={`flex flex-col items-center gap-0.5 rounded-full px-3 py-2 text-[10px] font-medium transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
          >
            <Icon className="h-5 w-5" />
            <span>{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { getStoredToken, clearAuthSession } from "@/lib/api";
import { getFirebaseApp, type FirebaseApp } from "@/lib/firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Authenticating — SafeHer AI" }] }),
  component: AuthRoute,
});

function AuthRoute() {
  const navigate = useNavigate();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      navigate({ to: "/app" });
      return;
    }

    const app = getFirebaseApp();
    if (!app) {
      navigate({ to: "/login" });
      return;
    }

    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate({ to: "/app" });
      } else {
        navigate({ to: "/login" });
      }
      setInitialized(true);
    });

    return () => unsubscribe();
  }, [navigate]);

  return <div className="min-h-screen bg-background" />;
}

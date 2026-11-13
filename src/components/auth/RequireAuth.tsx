"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import LoadingSection from "@/components/ui/LoadingSpinner";

// Wrap private pages with this: logged-out visitors are sent to /login and
// returned to the page they tried to open after finishing login.
export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) {
      try {
        sessionStorage.setItem(
          "booknook-next",
          `${window.location.pathname}${window.location.search}`
        );
      } catch {
        // Ignore; the user will just land on the home page after login.
      }

      router.replace("/login");
    }
  }, [ready, user, router]);

  if (!ready || !user) {
    return <LoadingSection />;
  }

  return <>{children}</>;
}

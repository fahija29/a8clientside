"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";

import { authClient } from "@/lib/auth-client";

export type AuthUser = {
  name: string;
  email: string;
  /** Included for API compatibility; the session user record itself no longer tracks it. */
  provider?: "password" | "google";
  /** Google account or profile photo; UI falls back to initials. */
  photo?: string;
  /**
   * ISO timestamp of account creation in MongoDB — shown as "Member since"
   * on the profile. Registered at sign-up, permanent for the account.
   */
  joinedAt?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  /** True once the Better Auth session has been resolved from the server. */
  ready: boolean;
  /** Push profile edits (name, photo …) onto the server-backed user record. */
  updateUser: (patch: Partial<AuthUser>) => Promise<void>;
  /** Ends the Better Auth session and returns to the home page. */
  logout: () => Promise<void>;
};

// The Better Auth session user (as delivered by /get-session). Only the
// fields the app renders are listed.
type SessionUser = {
  name: string;
  email: string;
  image?: string | null;
  createdAt?: string | Date;
};

function toAuthUser(user?: SessionUser | null): AuthUser | null {
  if (!user) {
    return null;
  }

  return {
    name: user.name,
    email: user.email,
    photo: user.image || undefined,
    joinedAt: user.createdAt
      ? new Date(user.createdAt).toISOString()
      : undefined,
  };
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // The session lives in an httpOnly cookie backed by the MongoDB session
  // record; this hook resolves it from the server on mount and reacts to
  // sign-in/out/update actions triggered anywhere in the app.
  const { data: session, isPending, refetch } = authClient.useSession();
  const user = toAuthUser(session?.user);

  const updateUser = useCallback(
    async (patch: Partial<AuthUser>) => {
      if (patch.name === undefined && patch.photo === undefined) {
        return;
      }

      // `image` is Better Auth's profile-photo field (it also receives the
      // Google account picture).
      await authClient.updateUser({
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.photo !== undefined ? { image: patch.photo } : {}),
      });

      // Refresh immediately so the profile card shows the saved values.
      await refetch();
    },
    [refetch]
  );

  const logout = useCallback(async () => {
    // Ends the session on the server and clears the httpOnly cookie.
    await authClient.signOut();

    // A remembered "take me back" destination belongs to the login that just
    // ended — drop it so the next login isn't hijacked by an old intent.
    try {
      sessionStorage.removeItem("booknook-next");
    } catch {
      // Ignore storage failures.
    }

    // Logout ALWAYS lands the reader on the home page, no matter which
    // page they logged out from (details, my-books, my-profile, …). A full
    // page load (window.location) is used on purpose rather than a
    // client-side router.push: signing out makes the current private
    // page's auth gate fire (its session just vanished) and that gate's
    // redirect to /login races the push — the hard load goes straight
    // home and the login page never flashes.
    window.location.replace("/");
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, ready: !isPending, updateUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}

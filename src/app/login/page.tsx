"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";
import GoogleButton from "@/components/auth/GoogleButton";
import PageTitle from "@/components/layout/PageTitle";
import ToastPopup, { type ToastData } from "@/components/ui/toast-popup";

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-400/60";

const labelClass = "mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300";

export default function LoginPage() {
  return (
    <>
      <PageTitle title="BookNook | Login" />
      <LoginForm />
    </>
  );
}

function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);

  // Toasts dismiss themselves after a few seconds.
  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 4200);

    return () => window.clearTimeout(timer);
  }, [toast]);

  function fail(message: string) {
    setToast({
      type: "error",
      title: "Login unsuccessful",
      message,
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.includes("@") || !email.trim()) {
      fail("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      fail("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);

    // Real authentication through Better Auth — the session is created by
    // the server (MongoDB-backed) and delivered as an httpOnly cookie.
    const { error } = await authClient.signIn.email({
      email: email.trim(),
      password,
    });

    setSubmitting(false);

    if (error) {
      fail(error.message ?? "Invalid email or password.");
      return;
    }

    // Signed in — the remembered route (if any) wins, else the home page.
    try {
      const next = sessionStorage.getItem("booknook-next");
      sessionStorage.removeItem("booknook-next");
      router.push(next || "/");
    } catch {
      router.push("/");
    }
  }

  function forgotPassword() {
    setToast({
      type: "success",
      title: "Password reset link sent",
      message: `We would email a reset link to ${
        email.trim() || "your email address"
      } (demo — no real email is sent).`,
    });
  }

  return (
    <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 px-4 py-16 dark:bg-[#0e1710]">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-[#141f17]">
        <h1 className="text-center font-serif text-3xl font-bold text-slate-900 dark:text-white">
          Login
        </h1>

        <p className="mt-2 text-center text-sm text-slate-400">
          Log in to borrow books and manage your library.
        </p>

        <div className="mt-8">
          <GoogleButton />
        </div>

        <div className="mt-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
          <span className="text-xs font-medium uppercase tracking-widest text-slate-500">
            or
          </span>
          <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className={labelClass}>
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className={inputClass}
            />
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor="password" className={labelClass}>
                Password
              </label>

              <button
                type="button"
                onClick={forgotPassword}
                className="text-xs font-medium text-emerald-600 transition hover:text-emerald-700 dark:text-emerald-300 dark:hover:text-emerald-200"
              >
                Forgot Password?
              </button>
            </div>

            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-emerald-500 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-60"
          >
            Login
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-emerald-600 transition hover:text-emerald-700 dark:text-emerald-300 dark:hover:text-emerald-200"
          >
            Register
          </Link>
        </p>
      </div>

      <ToastPopup toast={toast} onClose={() => setToast(null)} />
    </section>
  );
}

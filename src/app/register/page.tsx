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

export default function RegisterPage() {
  return (
    <>
      <PageTitle title="BookNook | Register" />
      <RegisterForm />
    </>
  );
}

function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  /** Password policy failures, rendered under the password field. */
  const [passwordError, setPasswordError] = useState("");

  // Toasts dismiss themselves, matching the page's playful tone.
  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 4200);

    return () => window.clearTimeout(timer);
  }, [toast]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setToast({
        type: "error",
        title: "Registration unsuccessful",
        message: "Please enter your name to create an account.",
      });
      return;
    }

    if (!email.includes("@") || !email.trim()) {
      setToast({
        type: "error",
        title: "Registration unsuccessful",
        message: "Please enter a valid email address.",
      });
      return;
    }

    // Photo URL is optional: empty is fine, but a value must be a real
    // http(s)/data image URL.
    const trimmedPhoto = photoUrl.trim();

    if (trimmedPhoto) {
      let validPhoto = false;

      try {
        const parsed = new URL(trimmedPhoto);
        validPhoto =
          parsed.protocol === "https:" ||
          parsed.protocol === "http:" ||
          parsed.protocol === "data:";
      } catch {
        validPhoto = false;
      }

      if (!validPhoto) {
        setToast({
          type: "error",
          title: "Registration unsuccessful",
          message: "Please enter a valid photo URL (https://…) or leave it empty.",
        });
        return;
      }
    }

    // Password policy: uppercase letter, lowercase letter, at least 6
    // characters. Invalid passwords block registration and the reason is
    // rendered in the form itself, next to the field.
    const missing = [
      !/[A-Z]/.test(password) && "an uppercase letter",
      !/[a-z]/.test(password) && "a lowercase letter",
      password.length < 6 && "at least 6 characters",
    ].filter(Boolean) as string[];

    if (missing.length > 0) {
      // Join only the rules that actually failed — never claim a requirement
      // is missing when the password already satisfies it.
      const list =
        missing.length === 1
          ? missing[0]
          : `${missing.slice(0, -1).join(", ")} and ${missing[missing.length - 1]}`;

      setPasswordError(`Your password must have ${list}.`);
      return;
    }

    setPasswordError("");

    if (password !== confirmPassword) {
      setToast({
        type: "error",
        title: "Registration unsuccessful",
        message: "Passwords do not match — please try again.",
      });
      return;
    }

    setSubmitting(true);

    // Real account creation through Better Auth — the user record (including
    // the account's createdAt, i.e. "Member since") is persisted to MongoDB
    // and the session starts immediately via an httpOnly cookie.
    const { error } = await authClient.signUp.email({
      name: name.trim(),
      email: email.trim(),
      password,
    });

    if (error) {
      setSubmitting(false);
      setToast({
        type: "error",
        title: "Registration unsuccessful",
        message:
          error.message ??
          "That email may already have an account — try logging in instead.",
      });
      return;
    }

    // A custom photo (when given) is stored with the user record server-side.
    if (trimmedPhoto) {
      try {
        await authClient.updateUser({ image: trimmedPhoto });
      } catch {
        // The photo is optional; registration already succeeded and the
        // profile can still be saved later from My Profile.
      }
    }

    setSubmitting(false);

    // A short beat so the success toast is visible before the redirect.
    // Registration also signs the reader in, so they go straight back to
    // the route they came from (remembered in booknook-next) — or home.
    setToast({
      type: "success",
      title: "Registration successful",
      message: "Account created — taking you right back to browsing…",
    });

    window.setTimeout(() => {
      try {
        const next = sessionStorage.getItem("booknook-next");
        sessionStorage.removeItem("booknook-next");
        router.push(next || "/");
      } catch {
        router.push("/");
      }
    }, 1100);
  }

  return (
    <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 px-4 py-16 dark:bg-[#0e1710]">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-[#141f17]">
        <h1 className="text-center font-serif text-3xl font-bold text-slate-900 dark:text-white">
          Create an account
        </h1>

        <p className="mt-2 text-center text-sm text-slate-400">
          Join BookNook to borrow books and share your collection.
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
            <label htmlFor="name" className={labelClass}>
              Full name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Jane Doe"
              className={inputClass}
            />
          </div>

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
            <label htmlFor="photo" className={labelClass}>
              Profile photo URL{" "}
              <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="photo"
              type="url"
              autoComplete="url"
              value={photoUrl}
              onChange={(event) => setPhotoUrl(event.target.value)}
              placeholder="https://example.com/photo.jpg"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="password" className={labelClass}>
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setPasswordError("");
              }}
              placeholder="••••••••"
              className={inputClass}
            />
            {passwordError ? (
              <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
                {passwordError}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="confirm" className={labelClass}>
              Confirm password
            </label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="••••••••"
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-emerald-500 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-60"
          >
            Register
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-emerald-600 transition hover:text-emerald-700 dark:text-emerald-300 dark:hover:text-emerald-200"
          >
            Login
          </Link>
        </p>
      </div>

      <ToastPopup toast={toast} onClose={() => setToast(null)} />
    </section>
  );
}

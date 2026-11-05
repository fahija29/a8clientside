"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { BookOpen, LogOut, Menu, User, X } from "lucide-react";

const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/books", label: "All Books" },
];

const privateLinks = [
  { href: "/add-book", label: "Add Book" },
  { href: "/my-books", label: "My Books" },
  { href: "/my-borrows", label: "My Borrows" },
];

// Opening Login/Register from a public page is a fresh intent — drop any
// remembered "booknook-next" destination (e.g. from an earlier abandoned
// login-first gate on a book details page) so a completed login/register
// lands where the user actually is headed: the intended page, or home.
function clearNextPath() {
  try {
    sessionStorage.removeItem("booknook-next");
  } catch {
    // Ignore storage failures.
  }
}

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-white/10 dark:bg-[#0e1710]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2.5"
            onClick={() => setMobileOpen(false)}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
              <BookOpen size={19} />
            </span>

            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              BookNook
            </span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {[...publicLinks, ...(user ? privateLinks : [])].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition ${
                  pathname === link.href
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-500 hover:text-emerald-600 dark:text-emerald-50/60 dark:hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2.5">
          <ThemeToggle />

          {user ? (
            <div className="relative">
              <button
                type="button"
                aria-label="Open user menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full ring-2 ring-emerald-600/20 transition hover:ring-emerald-600/60"
              >
                {user.photo ? (
                  <img
                    src={user.photo}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-emerald-600 text-sm font-bold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                  />

                  <div className="absolute right-0 z-50 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-[#141f17]">
                    <div className="border-b border-slate-100 px-3 pb-2.5 pt-1 dark:border-white/10">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {user.name}
                      </p>
                    </div>

                    <Link
                      href="/my-profile"
                      onClick={() => setMenuOpen(false)}
                      className="mt-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
                    >
                      <User size={16} />
                      My Profile
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                onClick={clearNextPath}
                className="hidden rounded-md border border-slate-300 px-3.5 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-900 sm:block dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
              >
                Login
              </Link>

              <Link
                href="/register"
                onClick={clearNextPath}
                className="hidden rounded-md bg-emerald-600 px-3.5 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-500 sm:block dark:bg-emerald-500 dark:hover:bg-emerald-400"
              >
                Register
              </Link>
            </>
          )}

          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 md:hidden dark:text-emerald-50/80 dark:hover:bg-white/5"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 px-4 py-4 md:hidden dark:border-white/10">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1">
            {[...publicLinks, ...(user ? privateLinks : [])].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  pathname === link.href
                    ? "bg-slate-100 text-slate-900 dark:bg-white/5 dark:text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-emerald-50/60 dark:hover:bg-white/5 dark:hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {!user && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => {
                    clearNextPath();
                    setMobileOpen(false);
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-center text-sm font-medium text-slate-700 dark:border-white/15 dark:bg-white/5 dark:text-slate-200"
                >
                  Login
                </Link>

                <Link
                  href="/register"
                  onClick={() => {
                    clearNextPath();
                    setMobileOpen(false);
                  }}
                  className="rounded-lg bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white dark:bg-emerald-500"
                >
                  Register
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

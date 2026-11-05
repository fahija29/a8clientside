"use client";

import { useRef, useState } from "react";

import PageTitle from "@/components/layout/PageTitle";
import { Spinner } from "@/components/ui/LoadingSpinner";
import RequireAuth from "@/components/auth/RequireAuth";
import { useAuth } from "@/components/auth/AuthProvider";

const MAX_IMAGE_BYTES = 1024 * 1024; // localStorage-friendly ceiling (1 MB)

export default function MyProfilePage() {
  return (
    <RequireAuth>
      <PageTitle title="BookNook | My Profile" />
      <ProfileContent />
    </RequireAuth>
  );
}

function ProfileContent() {
  const { user, ready, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState("");
  const [error, setError] = useState("");

  const memberSince = user?.joinedAt
    ? new Date(user.joinedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  if (!ready || !user) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  function startEditing() {
    setName(user?.name ?? "");
    setPhoto(user?.photo ?? "");
    setError("");
    setEditing(true);
  }

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setPhoto("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file for the photo.");
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setError("The photo must be smaller than 1 MB.");
      return;
    }

    setError("");

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPhoto(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function saveProfile() {
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    // The email is the identity — never editable; only name and photo.
    updateUser({
      name: name.trim(),
      ...(photo ? { photo } : {}),
    });

    setEditing(false);
  }

  return (
    <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#15291d] px-7 py-10 text-center shadow-lg">
        {editing ? (
          <>
            <button
              type="button"
              aria-label="Choose photo"
              onClick={() => fileInputRef.current?.click()}
              className="group mx-auto block"
            >
              {photo ? (
                <img
                  src={photo}
                  alt="Edit photo"
                  className="mx-auto h-24 w-24 rounded-full object-cover ring-4 ring-emerald-600/30 transition group-hover:ring-emerald-400/50"
                />
              ) : (
                <span className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-600 text-3xl font-bold text-white ring-4 ring-emerald-600/30 transition group-hover:ring-emerald-400/50">
                  {(name.trim() || user.name).charAt(0).toUpperCase()}
                </span>
              )}

              <span className="mt-2 block text-[11px] font-medium text-emerald-400 group-hover:text-emerald-300">
                Change photo (up to 1 MB)
              </span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />

            <div className="mt-5 text-left">
              <label
                htmlFor="profile-name"
                className="mb-1 block text-xs font-medium text-slate-300"
              >
                Full Name
              </label>
              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-500/30"
              />

              <label
                htmlFor="profile-email"
                className="mb-1 mt-3 block text-xs font-medium text-slate-300"
              >
                Email
              </label>
              <input
                id="profile-email"
                type="email"
                readOnly
                value={user.email}
                className="w-full cursor-default rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-400 opacity-80"
              />

              {error && (
                <p className="mt-2 rounded-md bg-red-500/10 px-3 py-1.5 text-xs text-red-400">
                  {error}
                </p>
              )}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-md border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-white/30 hover:bg-white/10"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveProfile}
                className="rounded-md bg-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-100 dark:bg-emerald-500 dark:hover:bg-emerald-400"
              >
                Save Changes
              </button>
            </div>
          </>
        ) : (
          <>
            {user.photo ? (
              <img
                src={user.photo}
                alt={user.name}
                className="mx-auto h-24 w-24 rounded-full object-cover ring-4 ring-emerald-600/30"
              />
            ) : (
              <span className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-600 text-3xl font-bold text-white ring-4 ring-emerald-600/30">
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}

            <h1 className="mt-5 font-serif text-3xl font-bold tracking-tight text-white">
              {user.name}
            </h1>

            <p className="mt-1.5 text-sm text-slate-400">{user.email}</p>

            <p className="mt-2 text-xs text-slate-500">
              {memberSince ? `Member since ${memberSince}` : "BookNook member"}
            </p>

            <button
              type="button"
              onClick={startEditing}
              className="mt-6 rounded-md border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:border-emerald-400/40 hover:bg-white/10 hover:text-emerald-200"
            >
              ✎ Edit Profile
            </button>
          </>
        )}
      </div>
    </section>
  );
}

"use client";

// Re-export shim: the original shadcn/ui `toast` module was unused in this
// app (no imports anywhere in src/), so this file now simply forwards to
// the custom toast popup that the register page uses.
export { default, type ToastData } from "./toast-popup";

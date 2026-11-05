"use client";

import { useEffect } from "react";

/**
 * Sets the browser tab title for the route that renders it.
 * Client pages can't export `metadata`, so we set it directly.
 */
export default function PageTitle({ title }: { title: string }) {
  useEffect(() => {
    document.title = title;

    return () => {
      document.title = "BookNook | Your Small Online Library";
    };
  }, [title]);

  return null;
}

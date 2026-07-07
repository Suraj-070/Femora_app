"use client";

import { useEffect } from "react";

// Installed PWAs (home screen icon, standalone mode) generally need an
// active service worker controlling the page for Android's app-mode
// launcher to work reliably — a plain browser tab doesn't need this, which
// is why "works in a tab, fails from the home screen icon" is the exact
// symptom of this being missing. Previously this only registered when
// someone opted into push notifications, so most installs had no service
// worker at all.
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/service-worker.js").catch(() => {
      // Non-fatal — push notifications and the standalone-launch benefit
      // just won't be available, but the app itself still works in-browser.
    });
  }, []);

  return null;
}

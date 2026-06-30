"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { useState, type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 2 * 60 * 1000, // 2 min
            gcTime: 10 * 60 * 1000,   // keep cache 10 min
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  const [persister] = useState(() => {
    // Guard for SSR — localStorage doesn't exist server-side
    if (typeof window === "undefined") return undefined;
    return createSyncStoragePersister({
      storage: window.localStorage,
      key: "femora-query-cache",
      throttleTime: 1000,
    });
  });

  // On server, just use plain QueryClientProvider (persister unavailable)
  if (!persister) {
    return (
      <SessionProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <QueryClientProvider client={client}>{children}</QueryClientProvider>
        </ThemeProvider>
      </SessionProvider>
    );
  }

  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <PersistQueryClientProvider
          client={client}
          persistOptions={{
            persister,
            maxAge: 10 * 60 * 1000, // matches gcTime
          }}
        >
          {children}
        </PersistQueryClientProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
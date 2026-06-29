// src/hooks/use-push-notifications.ts
// Handles service worker registration + push subscription management.

import { useState, useEffect, useCallback } from "react";

const PUBLIC_VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}

export type NotificationPermission = "default" | "granted" | "denied";

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;

    setIsSupported(supported);

    if (!supported) return;

    setPermission(Notification.permission as NotificationPermission);

    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setIsSubscribed(!!sub);
      });
    });
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    setIsLoading(true);

    try {
      const reg = await navigator.serviceWorker.register("/service-worker.js");
      await navigator.serviceWorker.ready;

      const perm = await Notification.requestPermission();
      setPermission(perm as NotificationPermission);

      if (perm !== "granted") {
        setIsLoading(false);
        return false;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
      });

      const subJson = sub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: subJson.keys,
        }),
      });

      if (!res.ok) throw new Error("Failed to save subscription");

      setIsSubscribed(true);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error("Push subscription error:", err);
      setIsLoading(false);
      return false;
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    setIsLoading(true);

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();

      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        });
      }

      setIsSubscribed(false);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error("Push unsubscribe error:", err);
      setIsLoading(false);
      return false;
    }
  }, [isSupported]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
  };
}
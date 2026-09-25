import { isSessionReason } from "@/lib/session-policy";

export function subscribeNotifications(refresh: () => void) {
  let source: EventSource | null = null;
  let fallback: ReturnType<typeof setInterval> | undefined;
  const stopFallback = () => {
    clearInterval(fallback);
    fallback = undefined;
  };
  const connect = () => {
    if (document.visibilityState === "hidden" || source) return;
    source = new EventSource("/api/notifications/stream");
    source.addEventListener("ready", () => {
      stopFallback();
      refresh();
    });
    source.addEventListener("notifications", refresh);
    source.addEventListener("session-invalid", (event) => {
      try {
        const { reason } = JSON.parse((event as MessageEvent).data);
        if (isSessionReason(reason)) {
          source?.close();
          stopFallback();
          window.dispatchEvent(
            new CustomEvent("session-invalid", { detail: reason }),
          );
        }
      } catch {
        /* Ignore malformed frames. */
      }
    });
    source.onerror = () => {
      if (fallback) return;
      // EventSource reconnects automatically; keep the feed usable meanwhile.
      refresh();
      fallback = setInterval(refresh, 30_000);
    };
  };
  const visibility = () => {
    if (document.visibilityState === "hidden") {
      source?.close();
      source = null;
      stopFallback();
    } else {
      connect();
    }
  };
  connect();
  document.addEventListener("visibilitychange", visibility);
  return () => {
    source?.close();
    stopFallback();
    document.removeEventListener("visibilitychange", visibility);
  };
}

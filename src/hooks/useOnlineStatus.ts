import { useSyncExternalStore } from "react";

function subscribeToOnlineStatus(onStoreChange: () => void) {
  window.addEventListener("online", onStoreChange);
  window.addEventListener("offline", onStoreChange);

  return () => {
    window.removeEventListener("online", onStoreChange);
    window.removeEventListener("offline", onStoreChange);
  };
}

function getOnlineStatus() {
  return navigator.onLine;
}

export function useOnlineStatus() {
  return useSyncExternalStore(subscribeToOnlineStatus, getOnlineStatus, () => true);
}

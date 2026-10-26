import { useSyncExternalStore } from "react";

/** The viewer's spoiler setting, kept in this browser only: every result is shown, or none is. */
const STORAGE_KEY = "spoilers";

const readHidden = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === "hidden";
  } catch {
    return false;
  }
};

let hidden = readHidden();
const listeners = new Set<() => void>();

const update = (next: boolean) => {
  hidden = next;
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);

  // Keep other open tabs in step.
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      update(readHidden());
    }
  };

  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
};

const getSnapshot = () => hidden;

export const useSpoilersHidden = () =>
  useSyncExternalStore(subscribe, getSnapshot);

export const setSpoilersHidden = (next: boolean) => {
  try {
    if (next) {
      localStorage.setItem(STORAGE_KEY, "hidden");
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Storage is blocked: the setting still holds until the page is reloaded.
  }

  update(next);
};

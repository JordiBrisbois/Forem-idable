"use client";

import { useSyncExternalStore } from "react";

/**
 * An external store backed by `localStorage`.
 *
 * Reading a browser store from an effect (and setting state from it) causes a
 * cascading render and hydration warnings. `useSyncExternalStore` is the React
 * answer: the server snapshot renders the default, React swaps to the real value
 * after hydration, and a same-tab write notifies every subscriber.
 *
 * The snapshot is cached by raw value so its identity stays stable: returning a
 * fresh object on every read would loop forever.
 */
export interface BrowserStore<T> {
  read: () => T;
  write: (value: T) => void;
  update: (updater: (current: T) => T) => void;
  subscribe: (listener: () => void) => () => void;
  useValue: () => T;
  /** Test helper: forget the cached snapshot. */
  resetForTests: () => void;
}

export function createBrowserStore<T>(options: {
  key: string;
  /** Returned on the server and while hydrating. Must be referentially stable. */
  defaultValue: T;
  parse: (raw: string) => T;
}): BrowserStore<T> {
  const { key, defaultValue, parse } = options;
  const changeEvent = `${key}:changed`;

  let cache: { raw: string | null; value: T } | null = null;

  const readRaw = (): string | null => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  };

  const read = (): T => {
    const raw = readRaw();
    if (cache && cache.raw === raw) return cache.value;

    let value = defaultValue;
    if (raw !== null) {
      try {
        value = parse(raw);
      } catch {
        value = defaultValue;
      }
    }

    cache = { raw, value };
    return value;
  };

  const notify = () => {
    window.dispatchEvent(new Event(changeEvent));
  };

  const subscribe = (listener: () => void) => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === key) listener();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(changeEvent, listener);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(changeEvent, listener);
    };
  };

  const write = (value: T) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Private mode / quota: keep the in-memory snapshot so the UI still works.
    }
    cache = { raw: JSON.stringify(value), value };
    notify();
  };

  const update = (updater: (current: T) => T) => {
    write(updater(read()));
  };

  function useValue(): T {
    return useSyncExternalStore(subscribe, read, () => defaultValue);
  }

  return {
    read,
    write,
    update,
    subscribe,
    useValue,
    resetForTests: () => {
      cache = null;
    },
  };
}

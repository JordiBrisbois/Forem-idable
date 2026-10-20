export type CacheLookup<T> =
  | {
      state: "fresh" | "stale";
      value: T;
      freshUntil: number;
      staleUntil: number;
    }
  | { state: "miss" };

export interface CacheWriteOptions {
  ttlMs: number;
  staleTtlMs: number;
}

export interface CacheStore {
  get<T>(key: string): Promise<CacheLookup<T>>;
  set<T>(key: string, value: T, options: CacheWriteOptions): Promise<void>;
  clear(): Promise<void>;
}

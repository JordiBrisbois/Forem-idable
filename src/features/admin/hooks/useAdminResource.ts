"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface ApiResponse<T> {
  response: Response;
  data: T;
}

export function useAdminResource<T>({
  isAuthorized,
  fetchFn,
  extract,
  errorMessage,
}: {
  isAuthorized: boolean;
  fetchFn: () => Promise<ApiResponse<Record<string, unknown>>>;
  extract: (data: Record<string, unknown>) => T[] | undefined;
  errorMessage: string;
}) {
  const [items, setItems] = useState<T[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Keep the latest callbacks without invalidating the stable `load` reference.
  // Synced in an effect rather than during render: writing a ref while rendering
  // is what React 19 forbids, and the values are only read from `load`, which
  // runs after commit.
  const fetchRef = useRef(fetchFn);
  const extractRef = useRef(extract);
  const messageRef = useRef(errorMessage);

  useEffect(() => {
    fetchRef.current = fetchFn;
    extractRef.current = extract;
    messageRef.current = errorMessage;
  }, [fetchFn, extract, errorMessage]);

  const load = useCallback(async () => {
    if (!isAuthorized) {
      setItems([]);
      return;
    }

    setIsLoading(true);
    setFeedback(null);

    try {
      const { response, data } = await fetchRef.current();
      const extracted = extractRef.current(data);

      if (!response.ok || !extracted) {
        setFeedback((data.error as string | undefined) || messageRef.current);
        return;
      }

      setItems(extracted);
    } catch {
      setFeedback(messageRef.current);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthorized]);

  // Memoize the returned object to ensure stability across renders
  return useMemo(
    () => ({
      items,
      setItems,
      feedback,
      setFeedback,
      isLoading,
      load,
    }),
    [items, feedback, isLoading, load]
  );
}

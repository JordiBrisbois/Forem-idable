"use client";

import { useCallback, useRef } from "react";

export function useMessageThreadScroll(isMobileViewport: boolean) {
  const mobileThreadBottomRef = useRef<HTMLDivElement | null>(null);
  const mobileThreadScrollAreaRef = useRef<HTMLDivElement | null>(null);
  const desktopThreadBottomRef = useRef<HTMLDivElement | null>(null);
  const desktopThreadScrollAreaRef = useRef<HTMLDivElement | null>(null);

  const scrollThreadToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      const activeScrollAreaRef = isMobileViewport
        ? mobileThreadScrollAreaRef
        : desktopThreadScrollAreaRef;
      const activeThreadBottomRef = isMobileViewport
        ? mobileThreadBottomRef
        : desktopThreadBottomRef;

      const viewport = activeScrollAreaRef.current?.querySelector<HTMLElement>(
        "[data-slot='scroll-area-viewport']"
      );

      if (viewport) {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior,
        });
        return;
      }

      activeThreadBottomRef.current?.scrollIntoView({
        behavior,
        block: "end",
      });
    },
    [isMobileViewport]
  );

  const scheduleScrollThreadToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          scrollThreadToBottom(behavior);
        });
      });
    },
    [scrollThreadToBottom]
  );

  return {
    desktopThreadBottomRef,
    desktopThreadScrollAreaRef,
    mobileThreadBottomRef,
    mobileThreadScrollAreaRef,
    scheduleScrollThreadToBottom,
  };
}

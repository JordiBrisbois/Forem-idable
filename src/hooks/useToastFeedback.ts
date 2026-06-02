"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

type FeedbackValue =
  | string
  | {
      type?: "success" | "error" | "info" | "warning";
      message: string;
    };

type UseToastFeedbackOptions = {
  title?: string;
};

export function useToastFeedback(
  feedback: FeedbackValue | null | undefined,
  options?: UseToastFeedbackOptions
) {
  const previousKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!feedback) {
      previousKeyRef.current = null;
      return;
    }

    const type = typeof feedback === "string" ? "info" : feedback.type ?? "info";
    const message = typeof feedback === "string" ? feedback : feedback.message;
    const key = `${type}:${message}`;

    if (previousKeyRef.current === key) {
      return;
    }

    previousKeyRef.current = key;

    const description = options?.title;
    switch (type) {
      case "success":
        toast.success(message, { description });
        return;
      case "error":
        toast.error(message, { description });
        return;
      case "warning":
        toast.warning(message, { description });
        return;
      default:
        toast(message, { description });
    }
  }, [feedback, options?.title]);
}

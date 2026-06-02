"use client";

import { useRef, useEffect, useCallback } from "react";
import { LoaderCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";

interface MessageComposerProps {
  draft: string;
  isSending: boolean;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  inputId: string;
  isMobile?: boolean;
}

export function MessageComposer({
  draft,
  isSending,
  onDraftChange,
  onSend,
  inputId,
  isMobile,
}: MessageComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const newHeight = Math.min(el.scrollHeight, isMobile ? 120 : 200);
    el.style.height = `${newHeight}px`;
  }, [isMobile]);

  useEffect(() => {
    adjustHeight();
  }, [draft, adjustHeight]);

  return (
    <div
      className={cn(
        "border-t border-border/60 bg-background/90 px-4 py-3 backdrop-blur",
        isMobile && "px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2.5"
      )}
    >
      <FieldGroup>
        <Field>
          {!isMobile ? (
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor={inputId}>Nouveau message</FieldLabel>
              <p className="text-[11px] text-muted-foreground">
                Entrée pour envoyer, Shift + Entrée pour une ligne
              </p>
            </div>
          ) : (
            <FieldLabel htmlFor={inputId} className="sr-only">
              Nouveau message
            </FieldLabel>
          )}
          <div
            className={cn(
              !isMobile && "mt-2",
              isMobile && "flex items-end gap-2 rounded-[1.4rem] border border-border/60 bg-background px-3 py-2 shadow-sm"
            )}
          >
            <textarea
              ref={textareaRef}
              id={inputId}
              value={draft}
              onChange={(event) => {
                onDraftChange(event.target.value);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  onSend();
                }
              }}
              placeholder={isMobile ? "Message..." : "Écrire un message..."}
              rows={1}
              className={cn(
                "w-full resize-none bg-transparent outline-none",
                isMobile
                  ? "min-h-0 px-0 py-1 text-[0.95rem] leading-6"
                  : "min-h-[3.5rem] rounded-xl border border-input px-3 py-2 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring"
              )}
            />
            {isMobile ? (
              <Button
                type="button"
                size="icon"
                className="mb-0.5 size-10 shrink-0 rounded-full"
                disabled={isSending || !draft.trim()}
                onClick={onSend}
                aria-label="Envoyer le message"
              >
                {isSending ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <Send />
                )}
              </Button>
            ) : null}
          </div>
        </Field>
      </FieldGroup>

      {!isMobile ? (
        <div className="mt-3 flex items-center justify-end gap-2">
          <Button
            type="button"
            size="sm"
            disabled={isSending || !draft.trim()}
            onClick={onSend}
          >
            {isSending ? (
              <LoaderCircle className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <Send className="mr-1.5 size-3.5" />
            )}
            Envoyer
          </Button>
        </div>
      ) : null}
    </div>
  );
}

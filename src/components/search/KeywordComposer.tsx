"use client";

import { KeyboardEvent, RefObject } from "react";
import { History, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { BooleanMode } from "@/types/search";

interface KeywordComposerProps {
  keywords: string[];
  inputValue: string;
  inputRef: RefObject<HTMLInputElement | null>;
  historyCount: number;
  onInputValueChange: (value: string) => void;
  onInputKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onInputBlur: () => void;
  onRemoveKeyword: (index: number) => void;
  onOpenHistory?: () => void;
}

export function KeywordComposer({
  keywords,
  inputValue,
  inputRef,
  historyCount,
  onInputValueChange,
  onInputKeyDown,
  onInputBlur,
  onRemoveKeyword,
  onOpenHistory,
}: KeywordComposerProps) {
  return (
    <div
      className={cn(
        "flex min-h-12 w-full flex-1 cursor-text flex-wrap items-center gap-2 border border-border bg-muted/20 p-2 px-4 transition-all focus-within:ring-2 focus-within:ring-primary/20",
        keywords.length > 0 ? "rounded-2xl" : "rounded-full"
      )}
      onClick={() => inputRef.current?.focus()}
    >
      <Search className="mr-1 h-5 w-5 shrink-0 text-muted-foreground" />

      {keywords.map((keyword, index) => (
        <KeywordBadge
          key={`${keyword}-${index}`}
          keyword={keyword}
          onRemove={() => onRemoveKeyword(index)}
        />
      ))}

      {keywords.length > 0 ? (
        <span className="mx-1 shrink-0 text-muted-foreground/30">|</span>
      ) : null}

      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(event) => onInputValueChange(event.target.value)}
        onKeyDown={onInputKeyDown}
        onBlur={onInputBlur}
        className="min-w-[80px] flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground/70"
        placeholder={
          keywords.length === 0
            ? "Ex: Développeur, Comptable..."
            : "Ajouter un mot-clé..."
        }
        aria-label="Mots-clés de recherche"
      />

      {historyCount > 0 && onOpenHistory ? (
        <TooltipProvider delayDuration={120}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="rounded-full"
                aria-label={`Ouvrir l'historique (${historyCount})`}
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenHistory();
                }}
              >
                <History />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              Historique ({historyCount})
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : null}
    </div>
  );
}

function KeywordBadge({
  keyword,
  onRemove,
}: {
  keyword: string;
  onRemove: () => void;
}) {
  return (
    <Badge
      variant="secondary"
      className="flex shrink-0 items-center gap-1 rounded-full border border-border px-3 py-1 text-sm shadow-sm"
    >
      {keyword}
      <Button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onRemove();
        }}
        variant="ghost"
        size="icon-xs"
        className="rounded-full"
        aria-label={`Retirer ${keyword}`}
      >
        <X className="h-3 w-3" />
      </Button>
    </Badge>
  );
}

interface BooleanModeToggleProps {
  booleanMode: BooleanMode;
  onToggle: () => void;
}

export function BooleanModeToggle({ booleanMode, onToggle }: BooleanModeToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Mode de recherche"
      className="flex items-center gap-1 rounded-full border border-border bg-muted/30 p-1"
    >
      <button
        type="button"
        role="radio"
        aria-checked={booleanMode === "OR"}
        onClick={() => {
          if (booleanMode !== "OR") onToggle();
        }}
        className={cn(
          "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
          booleanMode === "OR"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        OU
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={booleanMode === "AND"}
        onClick={() => {
          if (booleanMode !== "AND") onToggle();
        }}
        className={cn(
          "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
          booleanMode === "AND"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        ET
      </button>
    </div>
  );
}

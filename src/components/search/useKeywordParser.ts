"use client";

import { useState, useCallback, KeyboardEvent } from "react";

export interface KeywordParserState {
  keywords: string[];
  inputValue: string;
}

export interface UseKeywordParserReturn {
  keywords: string[];
  inputValue: string;
  setKeywords: React.Dispatch<React.SetStateAction<string[]>>;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  handleInputValueChange: (value: string) => void;
  handleKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  addKeyword: (kw: string) => void;
  removeKeyword: (index: number) => void;
  flushPendingInput: () => string[];
}

function splitKeywords(value: string): string[] {
  return value
    .split(/[,\s]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function appendKeywords(currentKeywords: string[], rawValue: string): string[] {
  const nextKeywords = splitKeywords(rawValue).filter(
    (item) => !currentKeywords.includes(item)
  );
  if (nextKeywords.length === 0) return currentKeywords;
  return [...currentKeywords, ...nextKeywords];
}

function extractCommittedKeywords(value: string): { committed: string[]; remainder: string } {
  if (!/[,\s]/.test(value)) {
    return { committed: [], remainder: value };
  }

  const hasTrailingSeparator = /[,\s]+$/.test(value);
  const parts = splitKeywords(value);

  if (parts.length === 0) {
    return { committed: [], remainder: "" };
  }

  if (hasTrailingSeparator) {
    return { committed: parts, remainder: "" };
  }

  return {
    committed: parts.slice(0, -1),
    remainder: parts[parts.length - 1] ?? "",
  };
}

export function useKeywordParser(
  initialKeywords: string[] = []
): UseKeywordParserReturn {
  const [keywords, setKeywords] = useState<string[]>(initialKeywords);
  const [inputValue, setInputValue] = useState("");

  const handleInputValueChange = useCallback((value: string) => {
    const { committed, remainder } = extractCommittedKeywords(value);

    if (committed.length === 0) {
      setInputValue(value);
      return;
    }

    setKeywords((current) => appendKeywords(current, committed.join(",")));
    setInputValue(remainder);
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (
        (event.key === "Enter" || event.key === " " || event.key === ",") &&
        inputValue.trim()
      ) {
        event.preventDefault();
        const next = appendKeywords(keywords, inputValue);
        setKeywords(next);
        setInputValue("");
      } else if (event.key === "Backspace" && !inputValue && keywords.length > 0) {
        setKeywords((current) => current.slice(0, -1));
      }
    },
    [inputValue, keywords]
  );

  const addKeyword = useCallback((kw: string) => {
    setKeywords((current) => appendKeywords(current, kw));
    setInputValue("");
  }, []);

  const removeKeyword = useCallback((index: number) => {
    setKeywords((current) => current.filter((_, i) => i !== index));
  }, []);

  const flushPendingInput = useCallback((): string[] => {
    const pendingText = inputValue.trim();
    if (!pendingText) {
      setInputValue("");
      return [...keywords];
    }
    const pendingKeywords = splitKeywords(pendingText).filter(
      (item) => !keywords.includes(item)
    );
    const finalKeywords = pendingKeywords.length > 0
      ? [...keywords, ...pendingKeywords]
      : [...keywords];
    setKeywords(finalKeywords);
    setInputValue("");
    return finalKeywords;
  }, [inputValue, keywords]);

  return {
    keywords,
    inputValue,
    setKeywords,
    setInputValue,
    handleInputValueChange,
    handleKeyDown,
    addKeyword,
    removeKeyword,
    flushPendingInput,
  };
}

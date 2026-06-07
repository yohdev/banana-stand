"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { INSTANCE_KEY, normalizeInstance } from "../instance";

type InstanceContextValue = {
  /** Raw text in the input field (what the user typed). */
  input: string;
  setInput: (value: string) => void;
  /** Normalized base URL to use in every snippet. Falls back to the default. */
  base: string;
  /** The server-provided default (real deploy URL or the placeholder). */
  defaultInstance: string;
  /** True when the user has supplied their own instance. */
  isCustom: boolean;
};

const InstanceContext = createContext<InstanceContextValue | null>(null);

export function InstanceProvider({
  defaultInstance,
  children,
}: {
  defaultInstance: string;
  children: React.ReactNode;
}) {
  const [input, setInputState] = useState("");

  // Restore a saved instance after mount (server renders with the default).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(INSTANCE_KEY);
      if (saved) setInputState(saved);
    } catch {
      /* private mode — session only */
    }
  }, []);

  const setInput = useCallback((value: string) => {
    setInputState(value);
    try {
      if (value.trim()) localStorage.setItem(INSTANCE_KEY, value);
      else localStorage.removeItem(INSTANCE_KEY);
    } catch {
      /* ignore persistence failures */
    }
  }, []);

  const normalized = normalizeInstance(input);
  const value = useMemo<InstanceContextValue>(
    () => ({
      input,
      setInput,
      base: normalized || defaultInstance,
      defaultInstance,
      isCustom: Boolean(normalized),
    }),
    [input, setInput, normalized, defaultInstance]
  );

  return (
    <InstanceContext.Provider value={value}>{children}</InstanceContext.Provider>
  );
}

export function useInstance(): InstanceContextValue {
  const ctx = useContext(InstanceContext);
  if (!ctx) {
    throw new Error("useInstance must be used within an InstanceProvider");
  }
  return ctx;
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Pickers, PlanBlock, PlanResponse } from "@/lib/types";
import { DEFAULT_BRIEF } from "@/data/samples";

export type Screen = 1 | 2 | 3 | 4 | 5;

export interface PlannerState {
  screen: Screen;
  brief: string;
  pickers: Pickers;
  response: PlanResponse | null;
  /** Current blocks, after any swaps. */
  blocks: PlanBlock[];
  approved: boolean;
  approvedAt: string | null; // ISO timestamp
  /** Picker to focus when returning to screen 1 from a "What we understood" tag. */
  focusField: FocusField | null;
}

export type FocusField = keyof Pickers | "brief";

const KEY = "gpp-state-v1";

export const INITIAL_STATE: PlannerState = {
  screen: 1,
  brief: DEFAULT_BRIEF,
  pickers: {},
  response: null,
  blocks: [],
  approved: false,
  approvedAt: null,
  focusField: null,
};

/** Highest screen the current state allows (no plan → screen 1, etc.). */
function maxScreen(s: PlannerState): Screen {
  if (!s.response || s.response.plan.status !== "ok") return 1;
  return s.approved ? 5 : 4;
}

function clamp(s: PlannerState): PlannerState {
  return s.screen > maxScreen(s) ? { ...s, screen: maxScreen(s) } : s;
}

/**
 * Planner state kept in sessionStorage. Screen changes push browser history,
 * so the browser Back button and the in-app Back button behave the same.
 */
export function usePlannerState() {
  const [state, setState] = useState<PlannerState>(INITIAL_STATE);
  const [hydrated, setHydrated] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Load once on mount.
  useEffect(() => {
    let loaded = INITIAL_STATE;
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) loaded = clamp({ ...INITIAL_STATE, ...JSON.parse(raw) });
    } catch {
      /* storage blocked or corrupt: start fresh */
    }
    setState(loaded);
    window.history.replaceState({ screen: loaded.screen }, "");
    setHydrated(true);
  }, []);

  // Save on every change.
  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, hydrated]);

  // Browser back/forward.
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const screen = (e.state?.screen ?? 1) as Screen;
      setState((s) => clamp({ ...s, screen }));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const update = useCallback((patch: Partial<PlannerState>) => {
    setState((s) => ({ ...s, ...patch }));
  }, []);

  const go = useCallback((screen: Screen) => {
    setState((s) => clamp({ ...s, screen }));
    window.history.pushState({ screen }, "");
    window.scrollTo({ top: 0 });
  }, []);

  const back = useCallback(() => {
    if (stateRef.current.screen > 1) window.history.back();
  }, []);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
    window.history.pushState({ screen: 1 }, "");
    window.scrollTo({ top: 0 });
  }, []);

  return { state, hydrated, update, go, back, reset };
}

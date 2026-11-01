"use client";

import { useState } from "react";
import type { Example } from "@/data/samples";
import type { Pickers, PlanResponse, Role } from "@/lib/types";
import Header from "@/components/Header";
import ProgressBar from "@/components/ProgressBar";
import { usePlannerState } from "@/components/usePlannerState";
import BriefScreen from "@/components/screens/BriefScreen";
import ProgrammeScreen from "@/components/screens/ProgrammeScreen";
import DetailsScreen from "@/components/screens/DetailsScreen";
import ProposalScreen from "@/components/screens/ProposalScreen";
import ImpactScreen from "@/components/screens/ImpactScreen";
import { planTitle, swapBlock } from "@/lib/programme";

export default function Planner({ role, initialRemaining }: { role: Role; initialRemaining: number | null }) {
  const [remaining, setRemaining] = useState(initialRemaining);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outOfScope, setOutOfScope] = useState(false);
  const { state, hydrated, update, go, back, reset } = usePlannerState();

  async function runPlan(brief: string, pickers: Pickers, regenerate = false) {
    setLoading(true);
    setError(null);
    setOutOfScope(false);
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief, pickers, regenerate }),
      });
      if (res.status === 401) {
        window.location.reload();
        return;
      }
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.plan) {
        setError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }
      const response = data as PlanResponse;
      setRemaining(response.remaining);
      if (response.plan.status === "out_of_scope") {
        setOutOfScope(true);
        if (state.screen !== 1) go(1);
        return;
      }
      update({ response, blocks: response.plan.blocks, approved: false, approvedAt: null });
      if (state.screen !== 2) go(2);
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function pickExample(e: Example) {
    update({ brief: e.brief, pickers: e.pickers });
    runPlan(e.brief, e.pickers);
  }

  let screen: React.ReactNode = null;
  if (hydrated) {
    if (state.screen === 1) {
      screen = (
        <BriefScreen
          brief={state.brief}
          pickers={state.pickers}
          loading={loading}
          error={error}
          outOfScope={outOfScope}
          focusField={state.focusField}
          onBrief={(brief) => update({ brief })}
          onPickers={(pickers) => update({ pickers })}
          onBuild={() => runPlan(state.brief, state.pickers)}
          onExample={pickExample}
          onFocused={() => update({ focusField: null })}
        />
      );
    } else if (state.response && state.screen === 2) {
      const u = state.response.plan.understood;
      screen = (
        <ProgrammeScreen
          response={state.response}
          blocks={state.blocks}
          pickers={state.pickers}
          role={role}
          remaining={remaining}
          regenerating={loading}
          error={error}
          onSwap={(i) => update({ blocks: swapBlock(state.blocks, i, u.groupSize, u.seniority), approved: false, approvedAt: null })}
          onEdit={(field) => {
            update({ focusField: field });
            go(1);
          }}
          onDetails={() => go(3)}
          onProposal={() => go(4)}
          onRegenerate={() => runPlan(state.brief, state.pickers, true)}
        />
      );
    } else if (state.response && state.screen === 3) {
      screen = (
        <DetailsScreen
          understood={state.response.plan.understood}
          blocks={state.blocks}
          brief={state.brief}
          onProposal={() => go(4)}
        />
      );
    } else if (state.response && state.screen === 4) {
      screen = (
        <ProposalScreen
          title={planTitle(state.response.plan)}
          understood={state.response.plan.understood}
          blocks={state.blocks}
          pickers={state.pickers}
          source={state.response.source}
          approved={state.approved}
          approvedAt={state.approvedAt}
          onApprove={() => update({ approved: true, approvedAt: new Date().toISOString() })}
          onSkip={() => go(5)}
        />
      );
    } else if (state.response && state.screen === 5) {
      screen = (
        <ImpactScreen
          title={planTitle(state.response.plan)}
          understood={state.response.plan.understood}
          blocks={state.blocks}
          pickers={state.pickers}
          onNewPlan={() => {
            setError(null);
            setOutOfScope(false);
            reset();
          }}
        />
      );
    }
  }

  return (
    <div className="min-h-screen">
      <Header role={role} remaining={remaining} />
      <ProgressBar screen={state.screen} onBack={back} />
      <main className="mx-auto max-w-6xl px-4 py-6">{screen}</main>
    </div>
  );
}

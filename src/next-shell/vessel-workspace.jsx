"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ContessaUiLogo } from "../components/branding.jsx";

// The workspace is driven entirely by persisted client state (localStorage),
// so it renders client-only: server markup could never match a returning
// visitor's data and would guarantee hydration mismatches.
const ContessaApp = dynamic(() => import("../contessa_mobile_task_app.jsx"), {
  ssr: false,
  loading: () => <WorkspaceLoading />,
});

function WorkspaceLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--mb-bg)]">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] border border-[var(--mb-line-strong)] bg-[var(--mb-panel)]">
          <ContessaUiLogo className="h-11 w-11" />
        </div>
        <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--mb-muted)]">
          Preparing the bridge
        </p>
      </div>
    </div>
  );
}

export function VesselWorkspace({ vesselId }) {
  const router = useRouter();

  return (
    <ContessaApp
      routeVesselId={vesselId}
      onNavigateVessel={(nextVesselId) => {
        router.push(`/vessels/${nextVesselId}`);
      }}
    />
  );
}

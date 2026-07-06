"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

// The workspace is driven entirely by persisted client state (localStorage),
// so it renders client-only: server markup could never match a returning
// visitor's data and would guarantee hydration mismatches.
const ContessaApp = dynamic(() => import("../contessa_mobile_task_app.jsx"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-[#04060d]">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(201,169,106,0.4)]">
          <span
            className="text-2xl italic leading-none text-[#e6cf9f]"
            style={{ fontFamily: "var(--font-display, Georgia, serif)", fontWeight: 600 }}
          >
            C
          </span>
        </div>
        <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.3em] text-[rgba(233,226,208,0.5)]">
          Preparing the bridge
        </p>
      </div>
    </div>
  ),
});

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

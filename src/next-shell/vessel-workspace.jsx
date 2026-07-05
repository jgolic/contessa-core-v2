"use client";

import { useRouter } from "next/navigation";
import ContessaApp from "../contessa_mobile_task_app.jsx";

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


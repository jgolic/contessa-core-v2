import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CrewListPrintView } from "../../../../../src/next-shell/crew-list-print-view";
import {
  formatVesselNameFromId,
  getInitialAppState,
  normalizeFleetVessel,
} from "../../../../../src/contessa_app_data.mjs";

function getPrintVessel(vesselId: string) {
  const state = getInitialAppState();
  const vessel = Array.isArray(state.vessels)
    ? state.vessels.find((item) => item?.id === vesselId)
    : null;

  return vessel ? normalizeFleetVessel(vessel, vesselId) : null;
}

export async function generateMetadata(
  { params }: { params: Promise<{ vesselId: string }> }
): Promise<Metadata> {
  const { vesselId } = await params;
  const vessel = getPrintVessel(vesselId);
  const vesselName = vessel?.name || formatVesselNameFromId(vesselId);

  return {
    title: `${vesselName} Crew List | Contessa Core`,
  };
}

export default async function CrewListPrintPage(
  { params }: { params: Promise<{ vesselId: string }> }
) {
  const { vesselId } = await params;
  const vessel = getPrintVessel(vesselId);

  if (!vessel) {
    notFound();
  }

  return <CrewListPrintView vessel={vessel} />;
}

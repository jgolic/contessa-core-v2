import type { Metadata } from "next";
import { formatVesselNameFromId } from "../../../../../../src/contessa_app_data.mjs";
import { CrewCvPageClient } from "../../../../../../src/next-shell/crew-cv-page-client";

export async function generateMetadata(
  { params }: { params: Promise<{ vesselId: string; crewId: string }> }
): Promise<Metadata> {
  const { vesselId, crewId } = await params;
  const crewName = String(crewId || "crew")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Crew";
  const vesselName = formatVesselNameFromId(vesselId);

  return {
    title: `${crewName} Demo CV | ${vesselName} | Contessa`,
  };
}

export default async function CrewCvPage(
  { params }: { params: Promise<{ vesselId: string; crewId: string }> }
) {
  const { vesselId, crewId } = await params;

  return <CrewCvPageClient vesselId={vesselId} crewId={crewId} />;
}

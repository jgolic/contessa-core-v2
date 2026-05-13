import type { Metadata } from "next";
import { VesselWorkspace } from "../../../src/next-shell/vessel-workspace";

function formatVesselTitle(vesselId: string) {
  return vesselId
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Contessa";
}

export async function generateMetadata(
  { params }: { params: Promise<{ vesselId: string }> }
): Promise<Metadata> {
  const { vesselId } = await params;
  const vesselName = formatVesselTitle(vesselId);

  return {
    title: `${vesselName} Operations | Contessa Core`,
  };
}

export default async function VesselPage(
  { params }: { params: Promise<{ vesselId: string }> }
) {
  const { vesselId } = await params;

  return <VesselWorkspace vesselId={vesselId} />;
}

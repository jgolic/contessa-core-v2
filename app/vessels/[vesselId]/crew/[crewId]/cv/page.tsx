import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CrewCvPrintButton } from "../../../../../../src/next-shell/crew-cv-print-button";
import {
  formatVesselNameFromId,
  getInitialAppState,
  normalizeFleetVessel,
} from "../../../../../../src/contessa_app_data.mjs";
import {
  generateDemoCrewCv,
  getCrewCvRouteId,
  getCrewFullName,
  slugify,
} from "../../../../../../src/lib/demo_crew_cv.mjs";

function getCvVessel(vesselId: string) {
  const state = getInitialAppState();
  const vessel = Array.isArray(state.vessels)
    ? state.vessels.find((item) => item?.id === vesselId)
    : null;

  return vessel ? normalizeFleetVessel(vessel, vesselId) : null;
}

function getCrewList(vessel: any) {
  if (Array.isArray(vessel?.crew)) return vessel.crew;
  if (Array.isArray(vessel?.crewProfiles)) return vessel.crewProfiles;
  if (Array.isArray(vessel?.workers)) return vessel.workers;
  return [];
}

function findCrewMember(vessel: any, crewId: string) {
  const requestedId = slugify(crewId);
  return getCrewList(vessel).find((member: any) => {
    const storedId = slugify(member?.id || "");
    const nameId = getCrewCvRouteId(member);
    const fullNameId = slugify(getCrewFullName(member));
    return [storedId, nameId, fullNameId].filter(Boolean).includes(requestedId);
  });
}

export async function generateMetadata(
  { params }: { params: Promise<{ vesselId: string; crewId: string }> }
): Promise<Metadata> {
  const { vesselId, crewId } = await params;
  const vessel = getCvVessel(vesselId);
  const person = vessel ? findCrewMember(vessel, crewId) : null;
  const vesselName = vessel?.name || formatVesselNameFromId(vesselId);
  const crewName = person ? getCrewFullName(person) : "Crew";

  return {
    title: `${crewName} Demo CV | ${vesselName} | Contessa Core`,
  };
}

export default async function CrewCvPage(
  { params }: { params: Promise<{ vesselId: string; crewId: string }> }
) {
  const { vesselId, crewId } = await params;
  const vessel = getCvVessel(vesselId);

  if (!vessel) {
    notFound();
  }

  const person = findCrewMember(vessel, crewId);

  if (!person) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h1 className="text-2xl font-semibold">Crew member not found</h1>
          <p className="mt-3 text-slate-300">
            This demo CV link does not match a crew member in {vessel.name}.
          </p>
          <Link href={`/vessels/${vesselId}`} className="mt-6 inline-flex rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100">
            Back to vessel
          </Link>
        </div>
      </main>
    );
  }

  const cv = generateDemoCrewCv(person, vessel);

  return (
    <main className="min-h-screen bg-[#eef5f2] px-4 py-8 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="mx-auto max-w-4xl">
        <div className="no-print mb-5 flex items-center justify-between gap-3">
          <Link
            href={`/vessels/${vesselId}`}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-blue-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
          >
            Back to vessel
          </Link>
          <CrewCvPrintButton />
        </div>

        <article className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)] dark:border-white/10 dark:bg-slate-900 sm:p-8">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 dark:border-amber-300/30 dark:bg-amber-300/10 dark:text-amber-100">
            {cv.disclaimer}
          </div>

          <header className="mt-8 border-b border-slate-200 pb-8 dark:border-white/10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-cyan-200">
              Crew Digital Passport
            </p>
            <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[0.06em] text-[#071A3A] dark:text-slate-50 sm:text-5xl">
              {cv.name}
            </h1>
            <p className="mt-3 text-lg font-semibold text-slate-700 dark:text-slate-300">
              {cv.position} · {cv.department}
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{cv.vesselName}</p>
          </header>

          <section className="mt-8 grid gap-4 sm:grid-cols-2">
            <InfoTile label="Nationality" value={cv.nationality} />
            <InfoTile label="Date of Birth" value={cv.dateOfBirth} />
            <InfoTile label="Passport No." value={cv.passportNumber} />
            <InfoTile label="Seaman's Book No." value={cv.seamansBookNumber} />
          </section>

          <section className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/[0.04]">
            <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">
              Professional Summary
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-700 dark:text-slate-300">{cv.summary}</p>
          </section>

          <section className="mt-8 grid gap-6 md:grid-cols-2">
            <CvList title="Key Skills" items={cv.keySkills} />
            <CvList title="Certificates" items={cv.certificates} />
          </section>

          <section className="mt-8">
            <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">
              Experience
            </h2>
            <div className="mt-4 space-y-4">
              {cv.experience.map((entry: any) => (
                <div
                  key={`${entry.vessel}-${entry.period}`}
                  className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-semibold text-slate-950 dark:text-slate-50">{entry.role}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{entry.period}</p>
                  </div>
                  <p className="mt-1 text-sm font-medium text-blue-700 dark:text-cyan-200">{entry.vessel}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{entry.details}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
            <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">
              Emergency Role
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-700 dark:text-slate-300">{cv.emergencyRole}</p>
          </section>
        </article>
      </div>
    </main>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-slate-50">{value || "-"}</p>
    </div>
  );
}

function CvList({ title, items = [] }: { title: string; items: string[] }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
      <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">{title}</h2>
      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500 dark:bg-cyan-300" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

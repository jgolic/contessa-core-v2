"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getInitialAppState,
  normalizeFleetVessel,
} from "../contessa_app_data.mjs";
import {
  findCrewById,
  generateDemoCrewCv,
} from "../lib/demo_crew_cv.mjs";
import {
  findVesselBySlug,
  getCanonicalVesselSlug,
} from "../lib/vessel_lookup.mjs";
import CrewDemoIdPortrait from "../components/CrewDemoIdPortrait";
import { getCrewIdentifierDisplay, getCrewIdentifierPrivacyNote } from "../lib/privacy.mjs";
import { canExposeSensitiveCrewData, canGenerateDemoCrewPortraits } from "../lib/runtime_config.mjs";
import { CrewCvPrintButton } from "./crew-cv-print-button";

function getClientVessel(vesselId = "") {
  const state = getInitialAppState();
  const vessel = findVesselBySlug(state.vessels, vesselId);
  return vessel ? normalizeFleetVessel(vessel, vessel?.id || vesselId) : null;
}

export function CrewCvPageClient({ vesselId = "", crewId = "" }) {
  const [mounted, setMounted] = useState(false);
  const [portraitDataUrl, setPortraitDataUrl] = useState("");
  const exposeSensitiveCrewData = canExposeSensitiveCrewData();
  const allowPortraitGeneration = canGenerateDemoCrewPortraits();
  const privacyNote = getCrewIdentifierPrivacyNote({ exposeSensitiveData: exposeSensitiveCrewData });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setPortraitDataUrl("");
  }, [vesselId, crewId]);

  const vessel = useMemo(() => {
    if (!mounted || !vesselId) return null;
    return getClientVessel(vesselId);
  }, [mounted, vesselId]);

  const person = useMemo(() => {
    if (!vessel || !crewId) return null;
    return findCrewById(vessel, crewId);
  }, [vessel, crewId]);

  if (!mounted) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          Loading crew CV...
        </div>
      </main>
    );
  }

  if (!vessel) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h1 className="text-2xl font-semibold">Vessel not found</h1>
          <p className="mt-3 text-slate-300">
            This demo CV link does not match an available vessel workspace.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-2xl bg-black/30 p-4 text-xs text-slate-300">
            Requested vessel slug: {vesselId}
          </pre>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            Demo CV QR for dynamic vessels uses localStorage and works in the same browser.
            For QR codes to work across devices, persist vessels and crew in a database.
          </p>
          <Link href="/vessels/contessa" className="mt-6 inline-flex rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100">
            Back to Contessa
          </Link>
        </div>
      </main>
    );
  }

  const canonicalVesselSlug = getCanonicalVesselSlug(vessel);

  if (!person) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h1 className="text-2xl font-semibold">Crew member not found</h1>
          <p className="mt-3 text-slate-300">
            This demo CV link does not match a crew member in {vessel.name}.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-2xl bg-black/30 p-4 text-xs text-slate-300">
            Requested crew id: {crewId}
          </pre>
          <Link href={`/vessels/${canonicalVesselSlug}`} className="mt-6 inline-flex rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100">
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
        <div className="no-print mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href={`/vessels/${canonicalVesselSlug}`}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-blue-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
          >
            Back to vessel
          </Link>
          <div className="flex flex-col gap-2 sm:items-end">
            <CrewCvPrintButton />
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Print settings: A4, scale 100%, headers/footers off.
            </p>
          </div>
        </div>

        <article className="cv-screen-card no-print rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)] dark:border-white/10 dark:bg-slate-900 sm:p-8">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 dark:border-amber-300/30 dark:bg-amber-300/10 dark:text-amber-100">
            {cv.disclaimer}
          </div>

          <header className="mt-8 border-b border-slate-200 pb-8 dark:border-white/10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-cyan-200">
                  Crew Digital Passport
                </p>
                <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[0.06em] text-[#071A3A] dark:text-slate-50 sm:text-5xl">
                  {cv.name}
                </h1>
                <p className="mt-3 text-lg font-semibold text-slate-700 dark:text-slate-300">
                  {cv.position} &middot; {cv.department}
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{cv.vesselName}</p>
              </div>

              <div className="shrink-0 self-center sm:self-auto">
                <CrewDemoIdPortrait
                  person={person}
                  vessel={vessel}
                  allowGenerate={allowPortraitGeneration}
                  generatedImageDataUrl={portraitDataUrl}
                  onImageGenerated={setPortraitDataUrl}
                />
              </div>
            </div>
          </header>

          <section className="mt-8 grid gap-4 sm:grid-cols-2">
            <InfoTile label="Nationality" value={cv.nationality} />
            <InfoTile label="Date of Birth" value={cv.dateOfBirth} />
            <InfoTile label="Passport No." value={getCrewIdentifierDisplay(cv.passportNumber, "Not set", { exposeSensitiveData: exposeSensitiveCrewData })} />
            <InfoTile label="Seaman's Book No." value={getCrewIdentifierDisplay(cv.seamansBookNumber, "Not set", { exposeSensitiveData: exposeSensitiveCrewData })} />
          </section>
          {privacyNote ? (
            <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">{privacyNote}</p>
          ) : null}

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
              {cv.experience.map((entry) => (
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

        <CrewCvPrintSheet cv={cv} person={person} vessel={vessel} portraitDataUrl={portraitDataUrl} exposeSensitiveCrewData={exposeSensitiveCrewData} />
      </div>
    </main>
  );
}

function CrewCvPrintSheet({ cv, person, vessel, portraitDataUrl, exposeSensitiveCrewData = true }) {
  return (
    <article className="crew-cv-print-sheet print-only">
      <header className="cv-print-header">
        <div>
          <p className="cv-print-kicker">Demo Crew Digital Passport</p>
          <h1>{cv.name}</h1>
          <p>{cv.position} &middot; {cv.department}</p>
          <p>{cv.vesselName}</p>
        </div>
        <CrewDemoIdPortrait
          person={person}
          vessel={vessel}
          size="print"
          generatedImageDataUrl={portraitDataUrl}
        />
      </header>

      <div className="cv-print-demo-warning">
        DEMO CV — GENERATED FOR TESTING ONLY. NOT AN OFFICIAL CREW DOCUMENT.
      </div>

      <section className="cv-print-info-grid">
        <div>
          <span>Nationality</span>
          <strong>{cv.nationality}</strong>
        </div>
        <div>
          <span>Date of Birth</span>
          <strong>{cv.dateOfBirth}</strong>
        </div>
        <div>
          <span>Passport No.</span>
          <strong>{getCrewIdentifierDisplay(cv.passportNumber, "Not set", { exposeSensitiveData: exposeSensitiveCrewData })}</strong>
        </div>
        <div>
          <span>Seaman's Book No.</span>
          <strong>{getCrewIdentifierDisplay(cv.seamansBookNumber, "Not set", { exposeSensitiveData: exposeSensitiveCrewData })}</strong>
        </div>
      </section>

      <section className="cv-print-section">
        <h2>Professional Summary</h2>
        <p>{cv.summary}</p>
      </section>

      <section className="cv-print-two-col">
        <div className="cv-print-section">
          <h2>Key Skills</h2>
          <ul>
            {(cv.keySkills || cv.skills || []).slice(0, 6).map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        </div>

        <div className="cv-print-section">
          <h2>Certificates</h2>
          <ul>
            {(cv.certificates || []).slice(0, 6).map((certificate) => (
              <li key={certificate}>{certificate}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="cv-print-section">
        <h2>Experience Note</h2>
        <p>
          Demo profile generated from vessel crew records for testing crew CV workflow,
          QR access, and onboard profile presentation.
        </p>
      </section>
    </article>
  );
}

function InfoTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-slate-50">{value || "-"}</p>
    </div>
  );
}

function CvList({ title, items = [] }) {
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

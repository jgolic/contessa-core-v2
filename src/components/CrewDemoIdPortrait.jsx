"use client";

import { useEffect, useMemo, useState } from "react";

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getCrewFullName(person) {
  return (
    person?.name ||
    person?.fullName ||
    [person?.firstName, person?.lastName].filter(Boolean).join(" ") ||
    "Crew"
  );
}

function getCrewPosition(person) {
  return person?.position || person?.title || person?.rank || person?.role || "Yacht Crew";
}

export function getCrewPortraitStorageKey(person, vessel) {
  const vesselId = vessel?.id || vessel?.slug || vessel?.name || "vessel";
  const crewId = person?.id || getCrewFullName(person);
  return `contessa-demo-crew-portrait:${vesselId}:${crewId}`;
}

export default function CrewDemoIdPortrait({
  person,
  vessel,
  size = "screen",
  className = "",
  allowGenerate = false,
  generatedImageDataUrl = "",
  onImageGenerated,
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const [cachedImageDataUrl, setCachedImageDataUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const name = getCrewFullName(person);
  const initials = useMemo(() => getInitials(name), [name]);
  const storageKey = useMemo(() => getCrewPortraitStorageKey(person, vessel), [person, vessel]);
  const imageUrl = generatedImageDataUrl || cachedImageDataUrl || person?.demoPiratePortraitUrl;
  const dimensions = size === "print" ? { width: 132, height: 164 } : { width: 168, height: 208 };

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  useEffect(() => {
    if (typeof window === "undefined" || !storageKey) return;

    try {
      const storedImage = window.localStorage.getItem(storageKey);
      if (storedImage) {
        setCachedImageDataUrl(storedImage);
        onImageGenerated?.(storedImage);
      }
    } catch {
      // Local cache is best-effort only; generation still works without it.
    }
  }, [onImageGenerated, storageKey]);

  async function generatePortrait() {
    if (!person || isGenerating) return;

    setIsGenerating(true);
    setGenerationError("");

    try {
      const response = await fetch("/api/demo-crew-portrait", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          position: getCrewPosition(person),
          department: person?.department || "General",
          vesselName: vessel?.name || vessel?.displayName || "Private Yacht",
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload?.imageDataUrl) {
        throw new Error(payload?.error || "Unable to generate portrait.");
      }

      setCachedImageDataUrl(payload.imageDataUrl);
      onImageGenerated?.(payload.imageDataUrl);

      try {
        window.localStorage.setItem(storageKey, payload.imageDataUrl);
      } catch {
        setGenerationError("Portrait generated, but this browser could not cache it.");
      }
    } catch (error) {
      setGenerationError(error?.message || "Unable to generate portrait.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="crew-demo-id-portrait-shell flex flex-col items-center gap-3">
      <figure
        className={[
          "crew-demo-id-portrait relative overflow-hidden rounded-[26px] border bg-white shadow-[0_18px_55px_rgba(15,23,42,0.14)]",
          "border-slate-200 dark:border-white/10 dark:bg-slate-900",
          className,
        ].join(" ")}
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        {imageUrl && !imageFailed ? (
          <img
            src={imageUrl}
            alt={`${name} demo pirate ID portrait`}
            className="h-full w-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-white to-blue-50 text-center dark:from-slate-900 dark:via-slate-950 dark:to-cyan-950/40">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-slate-300 bg-white text-2xl font-semibold text-[#071A3A] shadow-inner dark:border-white/10 dark:bg-slate-800 dark:text-cyan-100">
              {initials}
            </div>
            <p className="mt-4 px-4 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Demo portrait pending
            </p>
          </div>
        )}

        <figcaption className="absolute bottom-0 left-0 right-0 border-t border-white/40 bg-white/82 px-3 py-2 text-center backdrop-blur-md dark:border-white/10 dark:bg-slate-950/82">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
            Demo Pirate ID
          </p>
        </figcaption>
      </figure>

      {allowGenerate ? (
        <div className="no-print w-full max-w-[168px]">
          <button
            type="button"
            onClick={generatePortrait}
            disabled={isGenerating}
            className="inline-flex min-h-10 w-full items-center justify-center rounded-2xl border border-amber-300 bg-amber-50 px-3 text-xs font-bold uppercase tracking-[0.12em] text-amber-900 shadow-sm transition hover:bg-amber-100 disabled:cursor-wait disabled:opacity-70 dark:border-amber-300/30 dark:bg-amber-300/10 dark:text-amber-100 dark:hover:bg-amber-300/18"
          >
            {isGenerating ? "Generating..." : imageUrl && !imageFailed ? "Regenerate" : "Generate AI Portrait"}
          </button>
          {generationError ? (
            <p className="mt-2 text-center text-xs font-medium text-rose-700 dark:text-rose-200">
              {generationError}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

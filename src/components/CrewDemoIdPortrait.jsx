"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

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

export default function CrewDemoIdPortrait({ person, size = "screen", className = "" }) {
  const [imageFailed, setImageFailed] = useState(false);
  const name = getCrewFullName(person);
  const initials = useMemo(() => getInitials(name), [name]);
  const imageUrl = person?.demoPiratePortraitUrl;
  const dimensions = size === "print" ? { width: 132, height: 164 } : { width: 168, height: 208 };

  return (
    <figure
      className={[
        "crew-demo-id-portrait relative overflow-hidden rounded-[26px] border bg-white shadow-[0_18px_55px_rgba(15,23,42,0.14)]",
        "border-slate-200 dark:border-white/10 dark:bg-slate-900",
        className,
      ].join(" ")}
      style={{ width: dimensions.width, height: dimensions.height }}
    >
      {imageUrl && !imageFailed ? (
        <Image
          src={imageUrl}
          alt={`${name} demo pirate ID portrait`}
          fill
          sizes={`${dimensions.width}px`}
          className="object-cover"
          onError={() => setImageFailed(true)}
          priority={false}
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
  );
}

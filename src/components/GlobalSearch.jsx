"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function CommandSearchMark({ className = "" }) {
  return (
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={className}>
      <path
        d="M13.8 5.7 21 12.9l-7.2 7.2-7.2-7.2 7.2-7.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M13.8 5.7v14.4M6.6 12.9H21M10 9.1l7.6 7.6"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.42"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="15.2" cy="14.3" r="6.4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M20.1 19.2 26.1 25.2" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeText(value, fallback = "") {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    return value.title || value.name || value.message || value.description || value.context || fallback;
  }
  return fallback;
}

function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function getCrewName(person) {
  return person?.name || person?.fullName || [person?.firstName, person?.lastName].filter(Boolean).join(" ") || "Crew member";
}

function getCrewPosition(person) {
  return person?.position || person?.title || person?.rank || person?.role || "Crew";
}

function buildSearchIndex(vessel) {
  const tasks = safeArray(vessel?.tasks);
  const maintenance = safeArray(vessel?.maintenance);
  const approvals = safeArray(vessel?.approvals);
  const crew = safeArray(vessel?.crew || vessel?.crewProfiles);
  const documents = safeArray(vessel?.documents);
  const certificates = safeArray(vessel?.certificates);
  const vesselName = vessel?.name || vessel?.displayName || "Current vessel";

  return [
    {
      id: "dashboard",
      title: "Dashboard",
      type: "Section",
      context: "Main command overview",
      moduleId: "command",
      moduleName: "command",
      sectionId: "dashboard-section",
      targetId: "dashboard-section",
      keywords: "dashboard home overview command brief",
    },
    {
      id: "tasks",
      title: "Tasks",
      type: "Section",
      context: "Task board and active work",
      moduleId: "tasks-maintenance",
      moduleName: "tasks-maintenance",
      sectionId: "tasks-section",
      targetId: "tasks-section",
      options: { panel: "tasks" },
      keywords: "tasks work orders pending progress done",
    },
    {
      id: "maintenance",
      title: "Maintenance",
      type: "Section",
      context: "Due service and upkeep plan",
      moduleId: "tasks-maintenance",
      moduleName: "tasks-maintenance",
      sectionId: "maintenance-section",
      targetId: "maintenance-section",
      options: { panel: "maintenance" },
      keywords: "maintenance service engineering upkeep",
    },
    {
      id: "approvals",
      title: "Approvals",
      type: "Section",
      context: "Quotes, expenses, and decisions",
      moduleId: "expenses-approvals",
      moduleName: "expenses-approvals",
      sectionId: "approvals-section",
      targetId: "approvals-section",
      options: { bucket: "boat" },
      keywords: "approvals approval quote expense spend money decision",
    },
    {
      id: "crew",
      title: "Crew",
      type: "Section",
      context: "Crew roster and readiness",
      moduleId: "crew-certificates",
      moduleName: "crew-certificates",
      sectionId: "crew-section",
      targetId: "crew-section",
      options: { panel: "crew" },
      keywords: "crew roster people certificates onboard",
    },
    {
      id: "crew-list",
      title: "Crew List",
      type: "Document",
      context: `Printable crew list for ${vesselName}`,
      moduleId: "crew-certificates",
      moduleName: "crew-certificates",
      sectionId: "crew-section",
      targetId: "crew-list-action",
      action: "crew-list",
      options: { panel: "crew" },
      keywords: "crew list print printable a4 document",
    },
    {
      id: "documents",
      title: "Documents",
      type: "Section",
      context: "Vessel records and documents",
      moduleId: "documents",
      moduleName: "documents",
      sectionId: "documents-section",
      targetId: "documents-section",
      keywords: "documents docs files records certificates manuals",
    },
    {
      id: "route",
      title: "Route",
      type: "Section",
      context: "Route planning and chart controls",
      moduleId: "route",
      moduleName: "route",
      sectionId: "route-section",
      targetId: "route-section",
      keywords: "route routing chart map navigation fuel depth",
    },
    ...tasks.map((task) => ({
      id: `task-${task?.id || slugify(task?.title)}`,
      title: safeText(task?.title || task?.name, "Task"),
      type: "Task",
      context: [task?.status, task?.priority, task?.assignedTo, task?.dueDate].filter(Boolean).join(" - "),
      moduleId: "tasks-maintenance",
      moduleName: "tasks-maintenance",
      sectionId: "tasks-section",
      targetId: task?.id ? `item-${task.id}` : "tasks-section",
      options: { panel: "tasks" },
      item: task,
      keywords: [task?.title, task?.name, task?.description, task?.status, task?.priority, task?.assignedTo].filter(Boolean).join(" "),
    })),
    ...maintenance.map((item) => ({
      id: `maintenance-${item?.id || slugify(item?.title)}`,
      title: safeText(item?.title || item?.name, "Maintenance"),
      type: "Maintenance",
      context: [item?.status, item?.system, item?.assignedTo].filter(Boolean).join(" - "),
      moduleId: "tasks-maintenance",
      moduleName: "tasks-maintenance",
      sectionId: "maintenance-section",
      targetId: item?.id ? `item-${item.id}` : "maintenance-section",
      options: { panel: "maintenance" },
      item,
      keywords: [item?.title, item?.name, item?.description, item?.status, item?.system].filter(Boolean).join(" "),
    })),
    ...approvals.map((approval) => ({
      id: `approval-${approval?.id || slugify(approval?.title)}`,
      title: safeText(approval?.title || approval?.name, "Approval"),
      type: "Approval",
      context: [approval?.amount, approval?.requester, approval?.status].filter(Boolean).join(" - "),
      moduleId: "expenses-approvals",
      moduleName: "expenses-approvals",
      sectionId: "approvals-section",
      targetId: approval?.id ? `item-${approval.id}` : "approvals-section",
      options: { bucket: "boat" },
      item: approval,
      keywords: [approval?.title, approval?.name, approval?.amount, approval?.requester, approval?.status].filter(Boolean).join(" "),
    })),
    ...crew.flatMap((person) => {
      const name = getCrewName(person);
      const position = getCrewPosition(person);
      const crewId = person?.id || slugify(name);

      return [
        {
          id: `crew-${crewId}`,
          title: name,
          type: "Crew",
          context: [position, person?.department, person?.nationality].filter(Boolean).join(" - "),
          moduleId: "crew-certificates",
          moduleName: "crew-certificates",
          sectionId: "crew-section",
          targetId: `item-${crewId}`,
          options: { panel: "crew" },
          item: person,
          keywords: [name, position, person?.department, person?.nationality].filter(Boolean).join(" "),
        },
        {
          id: `crew-cv-${crewId}`,
          title: `${name} CV`,
          type: "Crew CV",
          context: `Demo CV - ${position}`,
          moduleId: "crew-certificates",
          moduleName: "crew-certificates",
          sectionId: "crew-section",
          targetId: `item-${crewId}`,
          options: { panel: "crew" },
          item: person,
          keywords: `${name} cv demo crew profile`,
        },
      ];
    }),
    ...documents.map((doc) => ({
      id: `document-${doc?.id || slugify(doc?.title)}`,
      title: safeText(doc?.title || doc?.name, "Document"),
      type: "Document",
      context: [doc?.category, doc?.status, doc?.owner].filter(Boolean).join(" - "),
      moduleId: "documents",
      moduleName: "documents",
      sectionId: "documents-section",
      targetId: doc?.id ? `item-${doc.id}` : "documents-section",
      item: doc,
      keywords: [doc?.title, doc?.name, doc?.category, doc?.status, doc?.owner].filter(Boolean).join(" "),
    })),
    ...certificates.map((cert) => ({
      id: `certificate-${cert?.id || slugify(cert?.title || cert?.name)}`,
      title: safeText(cert?.title || cert?.name, "Certificate"),
      type: "Certificate",
      context: [cert?.holder, cert?.status, cert?.expiryDate].filter(Boolean).join(" - "),
      moduleId: "crew-certificates",
      moduleName: "crew-certificates",
      sectionId: "certificates-section",
      targetId: cert?.id ? `item-${cert.id}` : "certificates-section",
      options: { panel: "certificates" },
      item: cert,
      keywords: [cert?.title, cert?.name, cert?.holder, cert?.status].filter(Boolean).join(" "),
    })),
  ];
}

function normalizeResults(results = [], vessel) {
  const source = safeArray(results).length > 0 ? safeArray(results) : buildSearchIndex(vessel);

  return source.filter(Boolean).map((result) => ({
    ...result,
    searchText:
      result.searchText ||
      [result.id, result.type, result.title, result.context, result.keywords].filter(Boolean).join(" "),
  }));
}

function filterSearchResults(index, query) {
  const cleanQuery = String(query || "").trim().toLowerCase();
  if (!cleanQuery) return [];

  return index
    .filter((entry) => String(entry.searchText || "").toLowerCase().includes(cleanQuery))
    .slice(0, 12);
}

export default function GlobalSearch({
  vessel,
  results = [],
  onResultSelect,
  onJump,
  onOpenCrewList,
  placeholder = "Search crew, tasks, docs...",
}) {
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const index = useMemo(() => normalizeResults(results, vessel), [results, vessel]);
  const filteredResults = useMemo(() => filterSearchResults(index, query), [index, query]);
  const showSuggestions = open && query.trim().length > 0 && filteredResults.length > 0;

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    function handleSlashFocus(event) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      const tagName = String(target?.tagName || "").toLowerCase();
      if (tagName === "input" || tagName === "textarea" || target?.isContentEditable) return;
      if (!inputRef.current || inputRef.current.offsetParent === null) return;
      event.preventDefault();
      inputRef.current.focus();
      setOpen(true);
    }

    window.addEventListener("keydown", handleSlashFocus);
    return () => window.removeEventListener("keydown", handleSlashFocus);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  function selectResult(result) {
    if (!result) return;

    setOpen(false);
    setQuery("");
    setActiveIndex(0);

    if (result.action === "crew-list" && typeof onOpenCrewList === "function") {
      onOpenCrewList(result);
      return;
    }

    if (typeof onResultSelect === "function") {
      onResultSelect(result);
      return;
    }

    onJump?.(result);
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(index + 1, Math.max(filteredResults.length - 1, 0)));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }

    if (event.key === "Enter" && filteredResults.length > 0) {
      event.preventDefault();
      selectResult(filteredResults[activeIndex] || filteredResults[0]);
    }
  }

  // Riviera palette: champagne borders, gold accents on porcelain white.
  const inputShellClass =
    "border-[rgba(143,110,54,0.30)] bg-white/95 text-slate-950 shadow-[0_16px_45px_rgba(143,110,54,0.14)] hover:border-[rgba(143,110,54,0.48)] focus-within:border-[rgba(125,95,46,0.6)] focus-within:shadow-[0_0_0_4px_rgba(168,131,74,0.14),0_22px_60px_rgba(143,110,54,0.18)]";
  const iconClass =
    "border-[rgba(143,110,54,0.32)] bg-[rgba(233,212,156,0.35)] text-[#7d5f2e] hover:border-[rgba(125,95,46,0.55)] focus:ring-[rgba(168,131,74,0.35)]";
  const inputTextClass =
    "text-slate-950 placeholder:text-slate-500 caret-[#8f6e36] selection:bg-[rgba(201,169,106,0.30)]";
  const resultsPanelClass =
    "search-popover-light border-[rgba(143,110,54,0.25)] bg-white text-slate-950 shadow-[0_30px_100px_rgba(31,27,16,0.22)]";
  const resultRowClass = (active) =>
    active
      ? "bg-[rgba(201,169,106,0.16)] text-slate-950"
      : "text-slate-800 hover:bg-[rgba(201,169,106,0.08)]";
  const resultTitleClass = "text-slate-950";
  const resultContextClass = "text-slate-700";
  const resultTypeBadgeClass = "border-[rgba(143,110,54,0.30)] bg-[rgba(233,212,156,0.30)] text-[#7d5f2e]";

  return (
    <div ref={rootRef} data-global-search-root className="search-command-card relative z-[10000] w-full max-w-full overflow-visible md:max-w-4xl">
      <div
        data-global-search-input
        data-search-open={showSuggestions ? "true" : "false"}
        className={`group relative z-[10001] flex h-14 w-full items-center gap-3 rounded-[24px] border px-4 backdrop-blur-xl transition-all duration-200 lg:h-16 lg:gap-4 lg:rounded-[30px] lg:px-5 ${inputShellClass}`}
      >
        <button
          type="button"
          onClick={() => {
            inputRef.current?.focus();
            setOpen(Boolean(query.trim()));
          }}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border shadow-inner transition-all duration-200 hover:scale-[1.03] focus:outline-none focus:ring-2 lg:h-12 lg:w-12 ${iconClass}`}
          aria-label="Focus global search"
        >
          <CommandSearchMark className="h-5 w-5 drop-shadow-[0_0_10px_rgba(168,131,74,0.25)] md:h-6 md:w-6" />
        </button>

        <input
          ref={inputRef}
          value={query}
          type="search"
          name="command-search"
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`h-11 min-w-0 flex-1 bg-transparent text-base font-semibold outline-none lg:text-lg ${inputTextClass}`}
          style={{ colorScheme: "light" }}
          aria-label="Search crew, tasks, documents"
        />

        <div className="hidden shrink-0 items-center gap-2 text-xs font-semibold text-slate-600 lg:flex">
          <span>Jump anywhere</span>
          <span className="rounded-lg border border-[rgba(143,110,54,0.35)] bg-white px-2 py-1 text-slate-800 shadow-sm">
            Press /
          </span>
        </div>

        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
            className="rounded-xl px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-[rgba(201,169,106,0.12)]"
          >
            Esc
          </button>
        ) : null}
      </div>

      {showSuggestions ? (
        <div
          data-global-search-results
          data-search-suggestions="true"
          className={`absolute left-0 right-0 top-[calc(100%+10px)] z-[10002] max-h-[min(420px,70vh)] overflow-y-auto rounded-3xl border p-2 backdrop-blur-xl ${resultsPanelClass}`}
        >
          {filteredResults.map((result, index) => (
            <button
              key={result.id || `${result.type}-${result.title}-${index}`}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                selectResult(result);
              }}
              className={[
                "flex w-full items-center justify-between gap-4 rounded-2xl p-4 text-left transition",
                resultRowClass(index === activeIndex),
              ].join(" ")}
            >
              <div className="min-w-0 flex-1">
                <p className={`app-clamp-2 text-base font-semibold leading-snug ${resultTitleClass}`}>{result.title}</p>
                {result.context ? <p className={`app-clamp-2 mt-1 text-sm leading-5 ${resultContextClass}`}>{result.context}</p> : null}
              </div>
              <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${resultTypeBadgeClass}`}>
                {result.type || "Item"}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* Editorial module masthead — the merged Riviera Operations voice.
   Replaces the boxed banner cards the legacy modules opened with:
   flat kicker + serif headline + hairline rule, with the module's
   segment switch rendered as tracked-caps tabs instead of pills. */

export function ModuleMasthead({ kicker, title, subtitle, tabs = [], actions = null }) {
  const hasTabs = Array.isArray(tabs) && tabs.length > 0;
  return (
    <header className="rv-masthead">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <div className="rv-masthead-kicker">{kicker}</div>
          <h2 className="rv-masthead-title mt-2">{title}</h2>
          {subtitle ? <p className="rv-masthead-sub mt-1.5">{subtitle}</p> : null}
        </div>
        {hasTabs || actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-2">
            {hasTabs ? (
              <div className="rv-tabs" role="tablist">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={Boolean(tab.active)}
                    onClick={tab.onSelect}
                    className="rv-tab"
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            ) : null}
            {actions}
          </div>
        ) : null}
      </div>
      <div className="midnight-gold-rule mt-4" />
    </header>
  );
}

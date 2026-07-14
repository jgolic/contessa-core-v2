/* Editorial module masthead — the merged Riviera Operations voice.
   Replaces the boxed banner cards the legacy modules opened with:
   flat kicker + serif headline + hairline rule, with the module's
   segment switch rendered as tracked-caps tabs instead of pills. */

export function ModuleMasthead({ kicker, title, subtitle, tabs = [], actions = null }) {
  const hasTabs = Array.isArray(tabs) && tabs.length > 0;
  return (
    <header className="rv-masthead">
      <div className="rv-masthead-layout">
        <div className="min-w-0">
          <div className="rv-masthead-kicker">{kicker}</div>
          <h2 className="rv-masthead-title mt-2">{title}</h2>
          {subtitle ? <p className="rv-masthead-sub mt-1.5">{subtitle}</p> : null}
        </div>
        {hasTabs || actions ? (
          <div className="rv-masthead-controls">
            {hasTabs ? (
              <div className="rv-tab-group">
                <span className="rv-tabs-label">Choose view</span>
                <div className="rv-tabs" role="tablist" aria-label={`${kicker} views`}>
                  {tabs.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      role="tab"
                      aria-selected={Boolean(tab.active)}
                      onClick={tab.onSelect}
                      className="rv-tab"
                    >
                      <span className="rv-tab-indicator" aria-hidden="true" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}

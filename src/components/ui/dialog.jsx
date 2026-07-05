import { Children, cloneElement, createContext, useContext } from "react";
import { createPortal } from "react-dom";
import { useRevealHighlight } from "../../hooks/useRevealHighlight.js";

const DialogContext = createContext(null);

export function Dialog({ open, onOpenChange, children }) {
  return <DialogContext.Provider value={{ open, onOpenChange }}>{children}</DialogContext.Provider>;
}

export function DialogTrigger({ children }) {
  const ctx = useContext(DialogContext);
  const child = Children.only(children);
  return cloneElement(child, {
    onClick: (event) => {
      child.props.onClick?.(event);
      ctx?.onOpenChange?.(true);
    },
  });
}

export function DialogContent({ className = "", children }) {
  const ctx = useContext(DialogContext);
  const revealRef = useRevealHighlight(Boolean(ctx?.open), {
    radius: "30px",
    delay: 120,
  });

  if (!ctx?.open) return null;

  const content = (
    <div className="fixed inset-0 z-[30000] flex items-center justify-center bg-black/55 p-4" onMouseDown={() => ctx.onOpenChange(false)}>
      <div
        ref={revealRef}
        className={`ui-reveal-target relative max-h-[92vh] w-full max-w-lg overflow-y-auto p-5 shadow-2xl ${className}`.trim()}
        style={{ "--reveal-radius": "30px" }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="absolute right-5 top-5 rounded-lg border border-white/10 bg-[#162119]/92 px-3 py-1 text-sm text-slate-100 shadow"
          onClick={() => ctx.onOpenChange(false)}
        >
          Close
        </button>
        {children}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

export function DialogHeader({ children }) {
  return <div className="mb-4 pr-20">{children}</div>;
}

export function DialogTitle({ children }) {
  return <h2 className="text-xl font-semibold">{children}</h2>;
}

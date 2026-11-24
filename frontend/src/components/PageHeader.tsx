import type { ReactNode } from "react";

/**
 * The one page title recipe: 18px title, optional one-line description, and an
 * optional trailing action or status. Every sidebar page opens with this (Home
 * leads with its status header instead, at the same size), so titles, spacing
 * and heading level match page to page.
 */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  /** Right-aligned control or status, e.g. Import CSV or a connection pill. */
  action?: ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-[18px] font-medium text-slate">{title}</h2>
        {description && (
          <p className="mt-1 text-xs text-steel leading-relaxed">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

import type { ReactNode } from "react";
import type { LayoutMode } from "../hooks/useLayoutMode";

interface AppShellProps {
  header?: ReactNode;
  children: ReactNode;
  layoutMode: LayoutMode;
}

export function AppShell({ header, children, layoutMode }: AppShellProps) {
  return (
    <div id="app-root" className="app-shell" data-layout-mode={layoutMode}>
      {header ? (
        <header
          id="app-header"
          className="app-header mx-auto flex w-full max-w-[1760px] flex-wrap items-center justify-between gap-4 px-[clamp(24px,5vw,84px)] py-4"
        >
          {header}
        </header>
      ) : null}
      <main id="app-main" className="app-body">{children}</main>
    </div>
  );
}

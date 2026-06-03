import type { ReactNode } from "react";

interface AppShellProps {
  header: ReactNode;
  children: ReactNode;
}

export function AppShell({ header, children }: AppShellProps) {
  return (
    <div id="app-root">
      <header id="app-header" className="mb-3">
        {header}
      </header>
      <main id="app-main">{children}</main>
    </div>
  );
}

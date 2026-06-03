import type { ReactNode } from "react";

interface AppShellProps {
  header: ReactNode;
  children: ReactNode;
}

export function AppShell({ header, children }: AppShellProps) {
  return (
    <div id="app-root">
      <header
        id="app-header"
        className="mx-auto flex h-[clamp(76px,9vh,112px)] w-full max-w-[1760px] flex-wrap items-center justify-between gap-4 px-[clamp(24px,5vw,84px)] py-4"
      >
        {header}
      </header>
      <main id="app-main">{children}</main>
    </div>
  );
}

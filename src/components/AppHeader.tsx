import { Home, Search } from "lucide-react";

interface AppHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onHome: () => void;
  onOpenAdmin: () => void;
}

function HeaderMascot() {
  return (
    <svg
      className="header-mascot"
      viewBox="0 0 142 70"
      role="img"
      aria-label="Lesson Designer ukulele mark"
    >
      <g className="mascot-shadow">
        <ellipse cx="71" cy="62" rx="32" ry="5" fill="#6b5c64" />
      </g>
      <g className="mascot-body">
        <path
          d="M32 43c-10-9-10-24 1-32 13-10 33-1 35 15 9-10 27-8 34 4 7 11 2 27-11 32-13 5-25-2-29-13-8 8-21 7-30-6Z"
          fill="#fff8fb"
          stroke="#f5a9c8"
          strokeWidth="3"
        />
        <circle cx="52" cy="31" r="4" fill="#ef7fae" />
        <circle cx="83" cy="31" r="4" fill="#ef7fae" />
        <path
          d="M60 43c5 4 12 4 17 0"
          fill="none"
          stroke="#d76d9d"
          strokeLinecap="round"
          strokeWidth="3"
        />
        <path
          d="M101 19l22-11c5-2 10 3 8 8l-7 21"
          fill="#fff8fb"
          stroke="#f5a9c8"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        />
        <path d="M113 15l14 10M108 25l14 10" stroke="#f5a9c8" strokeLinecap="round" strokeWidth="2" />
      </g>
    </svg>
  );
}

export function AppHeader({
  searchTerm,
  onSearchChange,
  onHome,
  onOpenAdmin,
}: AppHeaderProps) {
  return (
    <>
      <div className="flex min-w-0 flex-1 items-center gap-3">
      <button
        type="button"
        onClick={onHome}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-rose-100 bg-white text-rose-300 shadow-neumorphic transition hover:scale-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-200"
          aria-label="홈으로 이동"
      >
          <Home size={19} aria-hidden="true" />
      </button>

        <label className="relative min-w-[260px] flex-1 sm:max-w-[620px]">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-rose-300"
            size={20}
            aria-hidden="true"
          />
        <input
            type="search"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
            aria-label="Search ukulele chords"
            className="h-12 w-full rounded-full border-2 border-rose-100 bg-white/90 pl-12 pr-5 text-base font-semibold text-stone-700 shadow-neumorphic-inset outline-none transition placeholder:text-stone-300 focus:border-rose-200 focus:ring-4 focus:ring-rose-100"
            placeholder="코드 검색"
        />
      </label>
      </div>

      <div className="header-mascot-stage" aria-hidden="true">
        <HeaderMascot />
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div className="admin-access">
          <button
            type="button"
            aria-label="관리자 페이지 열기"
            onClick={onOpenAdmin}
            className="admin-header-button"
          >
            관리자 페이지
          </button>
        </div>
        <button
          type="button"
          onClick={onHome}
          className="font-display text-xl font-extrabold tracking-[0.18em] text-rose-300 transition hover:text-rose-400 focus:outline-none focus-visible:rounded-full focus-visible:ring-4 focus-visible:ring-rose-100 sm:text-2xl"
        >
        Lesson Designer
        </button>
      </div>
    </>
  );
}

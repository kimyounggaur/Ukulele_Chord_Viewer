import { Home, Search } from "lucide-react";

interface AppHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onHome: () => void;
}

export function AppHeader({ searchTerm, onSearchChange, onHome }: AppHeaderProps) {
  return (
    <div className="flex min-h-[58px] items-center gap-3 rounded-lg border border-white/80 bg-white/82 px-3 py-2 shadow-neo backdrop-blur">
      <button
        type="button"
        onClick={onHome}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-pink-100 bg-white text-pink-400 shadow-neo-inset transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
        aria-label="Home"
      >
        <Home size={20} aria-hidden="true" />
      </button>

      <label className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-pink-200 bg-white px-4 py-2 shadow-neo-inset transition focus-within:border-pink-300 focus-within:ring-2 focus-within:ring-pink-200">
        <Search className="shrink-0 text-pink-400" size={20} aria-hidden="true" />
        <input
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          aria-label="Search ukulele chords"
          className="min-w-0 flex-1 bg-transparent text-[clamp(14px,1.7vh,18px)] text-zinc-700 outline-none placeholder:text-zinc-300"
          placeholder="C, Am, G7"
        />
      </label>

      <div className="hidden shrink-0 pl-3 text-right font-display text-[clamp(18px,2.7vh,30px)] font-semibold tracking-[0.25em] text-pink-300 sm:block">
        Lesson Designer
      </div>
    </div>
  );
}

import { FormEvent, useState } from "react";
import { Home, LayoutGrid, Lock, LogIn, LogOut, Search, ShieldCheck, UserPlus } from "lucide-react";
import type { AuthAction, AuthUser } from "../hooks/useAuth";

interface AppHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onHome: () => void;
  onOpenAdmin: () => void;
  canSearch: boolean;
  canManage: boolean;
  currentUser: AuthUser | null;
  onSignUp: AuthAction;
  onMemberLogin: AuthAction;
  onAdminLogin: AuthAction;
  onLogout: () => Promise<void>;
}

type AuthMode = "signup" | "member-login" | "admin-login";

const AUTH_LABELS: Record<AuthMode, string> = {
  signup: "회원가입",
  "member-login": "회원 로그인",
  "admin-login": "관리자 로그인",
};

function HeaderMascot() {
  return (
    <svg
      className="header-mascot"
      viewBox="0 0 260 76"
      role="img"
      aria-label="우쿨렐레를 연주하는 캐릭터"
    >
      <path
        className="mascot-path"
        d="M16 60c40-11 72-11 112 0s73 11 116-1"
        fill="none"
        stroke="#ffe4ef"
        strokeLinecap="round"
        strokeWidth="3"
      />
      <g className="music-note note-one">
        <circle cx="190" cy="22" r="3" fill="#f472b6" />
        <path d="M193 21V8l9 3" fill="none" stroke="#f472b6" strokeLinecap="round" strokeWidth="2" />
      </g>
      <g className="music-note note-two">
        <circle cx="221" cy="36" r="3" fill="#38bdf8" />
        <path d="M224 35V20l10 4" fill="none" stroke="#38bdf8" strokeLinecap="round" strokeWidth="2" />
      </g>
      <g className="header-mascot-character">
        <ellipse className="mascot-shadow" cx="64" cy="66" rx="26" ry="4.5" fill="#6b5c64" />
        <g className="mascot-body">
          <circle cx="60" cy="28" r="17" fill="#fff8fb" stroke="#f5a9c8" strokeWidth="3" />
          <path
            d="M48 19c4-12 25-11 31 0-2-13-19-20-31-11-7 5-10 13-8 21 2-4 5-7 8-10Z"
            fill="#ffd6e8"
            stroke="#f5a9c8"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <circle cx="54" cy="29" r="2.3" fill="#6d6670" />
          <circle cx="67" cy="29" r="2.3" fill="#6d6670" />
          <path
            d="M57 36c3 2.5 8 2.5 11 0"
            fill="none"
            stroke="#d76d9d"
            strokeLinecap="round"
            strokeWidth="2.4"
          />
          <path
            d="M44 47c7-9 29-9 37 0l4 18H40Z"
            fill="#fff1f7"
            stroke="#f5a9c8"
            strokeLinejoin="round"
            strokeWidth="3"
          />
          <path className="mascot-leg left-leg" d="M52 63l-7 7" stroke="#d76d9d" strokeLinecap="round" strokeWidth="4" />
          <path className="mascot-leg right-leg" d="M69 63l7 7" stroke="#d76d9d" strokeLinecap="round" strokeWidth="4" />
          <g className="ukulele">
            <ellipse cx="82" cy="46" rx="12" ry="10" fill="#f7c56f" stroke="#b97832" strokeWidth="2.5" />
            <ellipse cx="94" cy="43" rx="10" ry="8" fill="#f9d889" stroke="#b97832" strokeWidth="2.5" />
            <circle cx="88" cy="45" r="3" fill="#8a5627" />
            <path d="M101 40l28-11" stroke="#8a5627" strokeLinecap="round" strokeWidth="4" />
            <path d="M124 27l10-4" stroke="#8a5627" strokeLinecap="round" strokeWidth="6" />
            <path d="M79 43l35-13M80 47l36-13M81 51l37-14" stroke="#fff8dc" strokeLinecap="round" strokeWidth="1.2" />
          </g>
          <path
            className="mascot-arm fretting-arm"
            d="M75 44c9-8 18-12 28-13"
            fill="none"
            stroke="#f5a9c8"
            strokeLinecap="round"
            strokeWidth="5"
          />
          <path
            className="mascot-arm strum-arm"
            d="M47 47c13 4 23 5 36 2"
            fill="none"
            stroke="#f5a9c8"
            strokeLinecap="round"
            strokeWidth="5"
          />
        </g>
      </g>
    </svg>
  );
}

export function AppHeader({
  searchTerm,
  onSearchChange,
  onHome,
  onOpenAdmin,
  canSearch,
  canManage,
  currentUser,
  onSignUp,
  onMemberLogin,
  onAdminLogin,
  onLogout,
}: AppHeaderProps) {
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authPending, setAuthPending] = useState(false);

  const handleOpenAuth = (mode: AuthMode) => {
    setAuthMode(mode);
    setAuthMessage(null);
  };

  const handleCloseAuth = () => {
    setAuthMode(null);
    setAuthMessage(null);
  };

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!authMode || authPending) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    setAuthPending(true);
    try {
      const result =
        authMode === "signup"
          ? await onSignUp(email, password)
          : authMode === "member-login"
            ? await onMemberLogin(email, password)
            : await onAdminLogin(email, password);

      setAuthMessage(result.message);

      if (result.ok) {
        window.setTimeout(handleCloseAuth, 420);
      }
    } finally {
      setAuthPending(false);
    }
  };

  const handleAdminClick = () => {
    if (canManage) {
      onOpenAdmin();
      return;
    }

    handleOpenAuth("admin-login");
  };

  return (
    <>
      <div className="header-search-row flex min-w-0 flex-1 items-center gap-3">
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
            disabled={!canSearch}
            aria-label="Search ukulele chords"
            className="h-12 w-full rounded-full border-2 border-rose-100 bg-white/90 pl-12 pr-5 text-base font-semibold text-stone-700 shadow-neumorphic-inset outline-none transition placeholder:text-stone-300 focus:border-rose-200 focus:ring-4 focus:ring-rose-100 disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-300"
            placeholder={canSearch ? "코드 검색" : "로그인 후 검색"}
        />
          {!canSearch ? (
            <span className="search-lock-hint">
              <Lock size={13} aria-hidden="true" />
              로그인 필요
            </span>
          ) : null}
      </label>
      </div>

      <div className="header-mascot-stage" aria-hidden="true">
        <HeaderMascot />
      </div>

      <div className="header-right-actions">
        <div className={["header-auth-controls", currentUser ? "is-authenticated" : "is-guest"].join(" ")}>
          <div className="auth-actions">
            {currentUser ? (
              <>
                <span className={["auth-badge", currentUser.role === "admin" ? "is-admin" : ""].join(" ")}>
                  {currentUser.role === "admin" ? (
                    <ShieldCheck size={15} aria-hidden="true" />
                  ) : (
                    <LogIn size={15} aria-hidden="true" />
                  )}
                  {currentUser.role === "admin" ? "관리자" : "회원"} {currentUser.username}
                </span>
                <button type="button" className="auth-chip-button" onClick={onLogout}>
                  <LogOut size={14} aria-hidden="true" />
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="auth-chip-button is-member-action"
                  aria-label="회원가입"
                  onClick={() => handleOpenAuth("signup")}
                >
                  <UserPlus size={14} aria-hidden="true" />
                  <span className="auth-action-label">회원가입</span>
                </button>
                <button
                  type="button"
                  className="auth-chip-button is-member-action"
                  aria-label="회원로그인"
                  onClick={() => handleOpenAuth("member-login")}
                >
                  <LogIn size={14} aria-hidden="true" />
                  <span className="auth-action-label">회원로그인</span>
                </button>
              </>
            )}
          </div>
          <div className="admin-access">
            <button
              type="button"
              aria-label={canManage ? "관리자 페이지 열기" : "관리자 로그인 열기"}
              onClick={handleAdminClick}
              className={["admin-header-button", canManage ? "" : "is-locked"].join(" ")}
            >
              <LayoutGrid size={14} aria-hidden="true" />
              <span className="auth-action-label">관리자 페이지</span>
            </button>
          </div>
          {!currentUser ? (
            <button
              type="button"
              className="auth-chip-button admin-login-button"
              aria-label="관리자 로그인"
              onClick={() => handleOpenAuth("admin-login")}
            >
              <Lock size={14} aria-hidden="true" />
              <span className="auth-action-label">관리자 로그인</span>
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onHome}
          className="header-brand-button font-display text-xl font-extrabold tracking-[0.18em] text-rose-300 transition hover:text-rose-400 focus:outline-none focus-visible:rounded-full focus-visible:ring-4 focus-visible:ring-rose-100 sm:text-2xl"
        >
        Lesson Designer
        </button>
      </div>

      {authMode ? (
        <div className="auth-modal-backdrop" role="presentation" onMouseDown={handleCloseAuth}>
          <form
            className="auth-modal"
            onSubmit={handleAuthSubmit}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="auth-modal-header">
              <h2>{AUTH_LABELS[authMode]}</h2>
              <button type="button" onClick={handleCloseAuth} aria-label="로그인 창 닫기">
                닫기
              </button>
            </div>
            <label>
              이메일
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder={authMode === "admin-login" ? "admin@example.com" : "member@example.com"}
                required
              />
            </label>
            <label>
              비밀번호
              <input
                name="password"
                type="password"
                autoComplete={authMode === "signup" ? "new-password" : "current-password"}
                placeholder="비밀번호"
                required
              />
            </label>
            {authMode === "admin-login" ? (
              <p className="auth-modal-note">Supabase app_metadata role이 admin인 계정만 허용됩니다.</p>
            ) : (
              <p className="auth-modal-note">회원 로그인 후 검색 기능을 사용할 수 있습니다.</p>
            )}
            {authMessage ? <p className="auth-modal-message">{authMessage}</p> : null}
            <button type="submit" className="auth-submit-button" disabled={authPending}>
              {authPending ? "처리 중..." : AUTH_LABELS[authMode]}
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { matchPath, useLocation, useNavigate } from "react-router-dom";
import type { ChordQuality } from "./data/types";
import { staticChords } from "./data/chords";
import { qualityById } from "./data/chordQualities";
import { AppHeader } from "./components/AppHeader";
import { AppShell } from "./components/AppShell";
import { ChordDetail } from "./components/ChordDetail";
import { ChordGrid } from "./components/ChordGrid";
import { QualitySelector } from "./components/QualitySelector";
import { AdminPage } from "./components/AdminPage";
import { useAuth } from "./hooks/useAuth";
import { useClickSound } from "./hooks/useClickSound";
import { useIndexedChordImages } from "./hooks/useIndexedChordImages";
import { AudioSettingsControl } from "./components/AudioSettingsControl";
import { useLayoutMode } from "./hooks/useLayoutMode";
import { useStageMode } from "./hooks/useStageMode";
import { useDebouncedValue } from "./hooks/useDebouncedValue";
import { useFavorites } from "./hooks/useFavorites";
import { useRecentChords } from "./hooks/useRecentChords";
import type { GridFocusRequest } from "./hooks/useRovingChordGrid";
import { chordPath, qualityPath, readRouteSegment, readVoicingIndex } from "./routing/routes";

interface AppRouteState {
  fromApp?: boolean;
}

function asQuality(value: string | undefined): ChordQuality | null {
  if (!value || !Object.prototype.hasOwnProperty.call(qualityById, value)) return null;
  return value as ChordQuality;
}

function RouteError({ onHome }: { onHome: () => void }) {
  return (
    <section className="screen-panel grid place-items-center px-6 text-center" aria-labelledby="route-error-heading">
      <div className="rounded-2xl border border-rose-100 bg-white p-8 shadow-neumorphic">
        <h1 id="route-error-heading" className="font-display text-3xl font-extrabold text-stone-800">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="mt-3 font-semibold text-stone-500">코드 주소가 올바른지 확인하거나 첫 화면으로 돌아가세요.</p>
        <button type="button" className="module-back-button mt-6 px-5" onClick={onHome}>
          코드 종류 보기
        </button>
      </div>
    </section>
  );
}

function App() {
  useClickSound();

  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [adminPageOpen, setAdminPageOpen] = useState(false);
  const [gridFocusRequest, setGridFocusRequest] = useState<GridFocusRequest | null>(null);
  const [qualityFocusRequest, setQualityFocusRequest] = useState<GridFocusRequest | null>(null);
  const focusNonceRef = useRef(0);
  const focusSearchAfterGridRef = useRef(false);
  const auth = useAuth();
  const uploadedImages = useIndexedChordImages();
  const { stageMode, toggleStageMode } = useStageMode();
  const layoutMode = useLayoutMode(stageMode);
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 120);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { recentChordIds, addRecentChord } = useRecentChords();

  const chordMatch = matchPath({ path: "/c/:chordId", end: true }, location.pathname);
  const qualityMatch = matchPath({ path: "/q/:quality", end: true }, location.pathname);
  const selectedQualityId = asQuality(qualityMatch?.params.quality);
  const routeChordId = readRouteSegment(chordMatch?.params.chordId);
  const selectedChord = useMemo(
    () => staticChords.find((chord) => chord.id === routeChordId || chord.legacyId === routeChordId) ?? null,
    [routeChordId],
  );
  const voicingIndex = selectedChord
    ? readVoicingIndex(location.search, selectedChord.voicings.length)
    : 0;

  const relatedChords = useMemo(
    () => selectedChord
      ? staticChords.filter((chord) => chord.quality === selectedChord.quality)
      : [],
    [selectedChord],
  );
  const recentChords = useMemo(
    () => recentChordIds
      .map((id) => staticChords.find((chord) => chord.id === id))
      .filter((chord): chord is (typeof staticChords)[number] => Boolean(chord)),
    [recentChordIds],
  );

  useEffect(() => {
    if (selectedChord) addRecentChord(selectedChord.id);
  }, [addRecentChord, selectedChord]);

  useEffect(() => {
    if (location.pathname !== "/") setAdminPageOpen(false);
  }, [location.pathname]);

  const requestGridFocus = useCallback((chordId: string) => {
    focusNonceRef.current += 1;
    setGridFocusRequest({ id: chordId, nonce: focusNonceRef.current });
  }, []);

  const handleHome = useCallback(() => {
    setSearchTerm("");
    setFavoritesOnly(false);
    setAdminPageOpen(false);
    setGridFocusRequest(null);
    setQualityFocusRequest(null);
    if (location.pathname !== "/") navigate("/");
  }, [location.pathname, navigate]);

  const handleSearchChange = useCallback((value: string) => {
    const startsSearching = !searchTerm.trim() && Boolean(value.trim());
    setSearchTerm(value);
    setAdminPageOpen(false);
    if (value.trim() && location.pathname !== "/") {
      navigate("/", { replace: startsSearching });
    }
  }, [location.pathname, navigate, searchTerm]);

  const handleSelectQuality = useCallback((qualityId: ChordQuality) => {
    setSearchTerm("");
    setAdminPageOpen(false);
    setQualityFocusRequest(null);
    const firstChord = staticChords.find((chord) => chord.quality === qualityId);
    if (firstChord) requestGridFocus(firstChord.id);
    navigate(qualityPath(qualityId), { state: { fromApp: true } satisfies AppRouteState });
  }, [navigate, requestGridFocus]);

  const handleSelectChordFromGrid = useCallback((chordId: string) => {
    navigate(chordPath(chordId), { state: { fromApp: true } satisfies AppRouteState });
  }, [navigate]);

  const handleSelectRecentChord = useCallback((chordId: string) => {
    navigate(chordPath(chordId), { state: { fromApp: true } satisfies AppRouteState });
  }, [navigate]);

  const handleSelectRelatedChord = useCallback((chordId: string) => {
    navigate(chordPath(chordId), { replace: true, state: location.state });
  }, [location.state, navigate]);

  const handleSelectVoicing = useCallback((index: number) => {
    if (!selectedChord) return;
    navigate(chordPath(selectedChord.id, index), { replace: true, state: location.state });
  }, [location.state, navigate, selectedChord]);

  const handleBackFromDetail = useCallback(() => {
    const routeState = location.state as AppRouteState | null;
    if (routeState?.fromApp) {
      navigate(-1);
      return;
    }
    if (selectedChord) navigate(qualityPath(selectedChord.quality), { replace: true });
    else navigate("/", { replace: true });
  }, [location.state, navigate, selectedChord]);

  const handleGridFocusRequestHandled = useCallback((handledRequest: GridFocusRequest) => {
    setGridFocusRequest((current) => current?.id === handledRequest.id && current.nonce === handledRequest.nonce
      ? null
      : current);
  }, []);

  const handleQualityFocusRequestHandled = useCallback((handledRequest: GridFocusRequest) => {
    setQualityFocusRequest((current) => current?.id === handledRequest.id && current.nonce === handledRequest.nonce
      ? null
      : current);
  }, []);

  const handleBackFromGrid = useCallback(() => {
    if (selectedQualityId) {
      focusNonceRef.current += 1;
      setQualityFocusRequest({ id: selectedQualityId, nonce: focusNonceRef.current });
    }
    setSearchTerm("");
    setFavoritesOnly(false);
    setGridFocusRequest(null);
    const routeState = location.state as AppRouteState | null;
    if (selectedQualityId && routeState?.fromApp) {
      navigate(-1);
    } else if (location.pathname !== "/") {
      navigate("/", { replace: true });
    } else {
      focusSearchAfterGridRef.current = true;
    }
  }, [location.pathname, location.state, navigate, selectedQualityId]);

  const handleOpenAdminPage = useCallback(() => {
    if (!auth.isAdmin) return;
    setSearchTerm("");
    setFavoritesOnly(false);
    if (location.pathname !== "/") navigate("/");
    setAdminPageOpen(true);
  }, [auth.isAdmin, location.pathname, navigate]);

  const routeIsHome = location.pathname === "/";
  const routeIsInvalid = !routeIsHome
    && (!chordMatch && !qualityMatch
      || Boolean(chordMatch && !selectedChord)
      || Boolean(qualityMatch && !selectedQualityId));
  const shouldShowGrid = Boolean(selectedQualityId)
    || (routeIsHome && Boolean(debouncedSearchTerm.trim()));

  useLayoutEffect(() => {
    if (shouldShowGrid || !focusSearchAfterGridRef.current) return;
    focusSearchAfterGridRef.current = false;
    document.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
  }, [shouldShowGrid]);

  return (
    <AppShell
      layoutMode={layoutMode}
      header={
        <AppHeader
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          onHome={handleHome}
          onOpenAdmin={handleOpenAdminPage}
          canManage={auth.isAdmin}
          currentUser={auth.currentUser}
          onSignUp={auth.signUp}
          onMemberLogin={auth.loginMember}
          onAdminLogin={auth.loginAdmin}
          onLogout={auth.logout}
          tools={<AudioSettingsControl />}
          stageMode={stageMode}
          onToggleStage={toggleStageMode}
        />
      }
    >
      {adminPageOpen && auth.isAdmin ? (
        <AdminPage
          chords={staticChords}
          getUploadedImageUrl={uploadedImages.getImageUrl}
          onUploadImage={uploadedImages.uploadImage}
          onDeleteImage={uploadedImages.deleteImage}
          onBack={handleHome}
        />
      ) : routeIsInvalid ? (
        <RouteError onHome={handleHome} />
      ) : selectedChord ? (
        <ChordDetail
          chord={selectedChord}
          voicingIndex={voicingIndex}
          onSelectVoicing={handleSelectVoicing}
          relatedChords={relatedChords}
          onSelectChord={handleSelectRelatedChord}
          onBack={handleBackFromDetail}
          getUploadedImageUrl={uploadedImages.getImageUrl}
          onUploadImage={uploadedImages.uploadImage}
          onDeleteImage={uploadedImages.deleteImage}
          adminMode={auth.isAdmin}
          isFavorite={isFavorite}
          onToggleFavorite={(chordId) => toggleFavorite(chordId)}
        />
      ) : shouldShowGrid ? (
        <ChordGrid
          chords={staticChords}
          selectedQualityId={selectedQualityId}
          searchTerm={debouncedSearchTerm}
          onSelectChord={handleSelectChordFromGrid}
          getUploadedImageUrl={uploadedImages.getImageUrl}
          onBack={handleBackFromGrid}
          layoutMode={layoutMode}
          focusRequest={gridFocusRequest}
          onFocusRequestHandled={handleGridFocusRequestHandled}
          locationKey={location.key}
          visitToken={location}
          favoritesOnly={favoritesOnly}
          onToggleFavoritesOnly={() => setFavoritesOnly((current) => !current)}
          isFavorite={isFavorite}
          onToggleFavorite={(chordId) => toggleFavorite(chordId)}
        />
      ) : (
        <QualitySelector
          selectedQualityId={selectedQualityId}
          onSelectQuality={handleSelectQuality}
          focusRequest={qualityFocusRequest}
          onFocusRequestHandled={handleQualityFocusRequestHandled}
          recentChords={recentChords}
          onSelectRecent={handleSelectRecentChord}
        />
      )}
    </AppShell>
  );
}

export default App;

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
import { useLessonSets } from "./hooks/useLessonSets";
import type { GridFocusRequest } from "./hooks/useRovingChordGrid";
import {
  chordPath,
  lessonSetPath,
  lessonSetPlayPath,
  lessonSetPrintPath,
  qualityPath,
  readRouteSegment,
  readVoicingIndex,
} from "./routing/routes";
import { LessonSetListPage } from "./components/lesson/LessonSetListPage";
import { LessonSetEditorPage } from "./components/lesson/LessonSetEditorPage";
import { LessonSlideshowPage } from "./components/lesson/LessonSlideshowPage";
import { LessonPrintPage } from "./components/lesson/LessonPrintPage";
import { AddToLessonSetDialog } from "./components/lesson/AddToLessonSetDialog";
import { LessonSetShareDialog } from "./components/lesson/LessonSetShareDialog";
import { SharedLessonSetImportPage } from "./components/lesson/SharedLessonSetImportPage";
import { QuizPage } from "./components/quiz/QuizPage";
import { encodeLessonSetShareData } from "./lessonSets/shareCodec";
import type { LessonSetSharePayload } from "./lessonSets/shareCodec";

interface AppRouteState {
  fromApp?: boolean;
  fromLessonSetId?: string;
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
  const [addToSetChordId, setAddToSetChordId] = useState<string | null>(null);
  const [sharingSetId, setSharingSetId] = useState<string | null>(null);
  const [lessonAnnouncement, setLessonAnnouncement] = useState("");
  const focusNonceRef = useRef(0);
  const focusSearchAfterGridRef = useRef(false);
  const addToSetOpenerRef = useRef<HTMLButtonElement | null>(null);
  const shareOpenerRef = useRef<HTMLButtonElement | null>(null);
  const addToSetLocationKeyRef = useRef<string | null>(null);
  const shareLocationKeyRef = useRef<string | null>(null);
  const auth = useAuth();
  const uploadedImages = useIndexedChordImages();
  const { stageMode, toggleStageMode } = useStageMode();
  const layoutMode = useLayoutMode(stageMode);
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 120);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { recentChordIds, addRecentChord } = useRecentChords();
  const lessonSetsState = useLessonSets();

  const chordMatch = matchPath({ path: "/c/:chordId", end: true }, location.pathname);
  const qualityMatch = matchPath({ path: "/q/:quality", end: true }, location.pathname);
  const lessonSetPlayMatch = matchPath({ path: "/sets/:setId/play", end: true }, location.pathname);
  const lessonSetPrintMatch = matchPath({ path: "/sets/:setId/print", end: true }, location.pathname);
  const lessonSetEditorMatch = matchPath({ path: "/sets/:setId", end: true }, location.pathname);
  const routeIsLessonSetList = location.pathname === "/sets";
  const routeIsQuiz = location.pathname === "/quiz";
  const routeIsSharedSet = location.pathname === "/set";
  const selectedQualityId = asQuality(qualityMatch?.params.quality);
  const routeChordId = readRouteSegment(chordMatch?.params.chordId);
  const selectedChord = useMemo(
    () => staticChords.find((chord) => chord.id === routeChordId || chord.legacyId === routeChordId) ?? null,
    [routeChordId],
  );
  const routeLessonSetId = readRouteSegment(
    lessonSetPlayMatch?.params.setId
      ?? lessonSetPrintMatch?.params.setId
      ?? lessonSetEditorMatch?.params.setId,
  );
  const selectedLessonSet = useMemo(
    () => lessonSetsState.lessonSets.find((lessonSet) => lessonSet.id === routeLessonSetId) ?? null,
    [lessonSetsState.lessonSets, routeLessonSetId],
  );
  const selectedLessonSetChords = useMemo(() => {
    if (!selectedLessonSet) return [];
    const chordsById = new Map(staticChords.map((chord) => [chord.id, chord]));
    return selectedLessonSet.chordIds
      .map((chordId) => chordsById.get(chordId))
      .filter((chord): chord is (typeof staticChords)[number] => Boolean(chord));
  }, [selectedLessonSet]);
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

  useEffect(() => {
    setAddToSetChordId(null);
    setSharingSetId(null);
  }, [location.pathname, location.search]);

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

  const handleOpenLessonSets = useCallback(() => {
    setSearchTerm("");
    setFavoritesOnly(false);
    setAdminPageOpen(false);
    navigate("/sets");
  }, [navigate]);

  const handleOpenQuiz = useCallback(() => {
    if (routeIsQuiz) return;
    setSearchTerm("");
    setFavoritesOnly(false);
    setAdminPageOpen(false);
    navigate("/quiz");
  }, [navigate, routeIsQuiz]);

  const handleCreateLessonSet = useCallback((title: string) => {
    const lessonSet = lessonSetsState.createSet({ title });
    navigate(lessonSetPath(lessonSet.id));
  }, [lessonSetsState, navigate]);

  const handleRequestAddToSet = useCallback((chordId: string, opener: HTMLButtonElement) => {
    addToSetOpenerRef.current = opener;
    addToSetLocationKeyRef.current = location.key;
    setAddToSetChordId(chordId);
  }, [location.key]);

  const handleCloseAddToSet = useCallback(() => {
    setAddToSetChordId(null);
    addToSetLocationKeyRef.current = null;
    window.requestAnimationFrame(() => addToSetOpenerRef.current?.focus());
  }, []);

  const handleOpenShare = useCallback((lessonSetId: string, opener: HTMLButtonElement) => {
    shareOpenerRef.current = opener;
    shareLocationKeyRef.current = location.key;
    setSharingSetId(lessonSetId);
  }, [location.key]);

  const handleCloseShare = useCallback(() => {
    setSharingSetId(null);
    shareLocationKeyRef.current = null;
    window.requestAnimationFrame(() => shareOpenerRef.current?.focus());
  }, []);

  const handleStartLessonSlideshow = useCallback((lessonSetId: string) => {
    try {
      const fullscreenRequest = document.documentElement.requestFullscreen?.();
      void fullscreenRequest?.catch(() => {
        // The route itself provides an immersive fallback when fullscreen is unavailable.
      });
    } catch {
      // Keep presenting in the in-app immersive layout.
    }
    navigate(lessonSetPlayPath(lessonSetId), {
      state: { fromLessonSetId: lessonSetId } satisfies AppRouteState,
    });
  }, [navigate]);

  const addToSetChord = useMemo(
    () => addToSetLocationKeyRef.current === location.key
      ? staticChords.find((chord) => chord.id === addToSetChordId) ?? null
      : null,
    [addToSetChordId, location.key],
  );
  const sharingLessonSet = useMemo(
    () => shareLocationKeyRef.current === location.key
      ? lessonSetsState.lessonSets.find((lessonSet) => lessonSet.id === sharingSetId) ?? null
      : null,
    [lessonSetsState.lessonSets, location.key, sharingSetId],
  );
  const lessonSetShareUrl = useMemo(() => {
    if (!sharingLessonSet) return "";
    try {
      const encoded = encodeLessonSetShareData(sharingLessonSet);
      const pageUrl = window.location.href.split("#")[0];
      return `${pageUrl}#/set?d=${encodeURIComponent(encoded)}`;
    } catch {
      return "";
    }
  }, [sharingLessonSet]);

  const sharedLessonSetData = routeIsSharedSet
    ? new URLSearchParams(location.search).get("d") ?? ""
    : "";

  const routeIsHome = location.pathname === "/";
  const isKnownRoute = routeIsHome
    || Boolean(chordMatch)
    || Boolean(qualityMatch)
    || routeIsLessonSetList
    || routeIsQuiz
    || routeIsSharedSet
    || Boolean(lessonSetPlayMatch)
    || Boolean(lessonSetPrintMatch)
    || Boolean(lessonSetEditorMatch);
  const routeIsInvalid = !isKnownRoute
    || Boolean(chordMatch && !selectedChord)
    || Boolean(qualityMatch && !selectedQualityId)
    || Boolean(
      (lessonSetPlayMatch || lessonSetPrintMatch || lessonSetEditorMatch)
      && !selectedLessonSet,
    );
  const shouldShowGrid = Boolean(selectedQualityId)
    || (routeIsHome && Boolean(debouncedSearchTerm.trim()));
  const routeIsImmersive = Boolean(
    selectedLessonSet && (lessonSetPlayMatch || lessonSetPrintMatch),
  );
  const currentSection = routeIsQuiz
    ? "quiz"
    : routeIsLessonSetList || Boolean(routeLessonSetId) || routeIsSharedSet
      ? "sets"
      : "chords";

  useLayoutEffect(() => {
    if (shouldShowGrid || !focusSearchAfterGridRef.current) return;
    focusSearchAfterGridRef.current = false;
    document.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
  }, [shouldShowGrid]);

  return (
    <AppShell
      layoutMode={layoutMode}
      header={routeIsImmersive ? undefined : (
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
          onOpenLessonSets={handleOpenLessonSets}
          onOpenQuiz={handleOpenQuiz}
          currentSection={currentSection}
        />
      )}
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
      ) : lessonSetPlayMatch && selectedLessonSet ? (
        <LessonSlideshowPage
          set={selectedLessonSet}
          chords={selectedLessonSetChords}
          onExit={() => {
            const routeState = location.state as AppRouteState | null;
            if (routeState?.fromLessonSetId === selectedLessonSet.id) navigate(-1);
            else navigate(lessonSetPath(selectedLessonSet.id), { replace: true });
          }}
        />
      ) : lessonSetPrintMatch && selectedLessonSet ? (
        <LessonPrintPage
          set={selectedLessonSet}
          chords={selectedLessonSetChords}
          onBack={() => {
            const routeState = location.state as AppRouteState | null;
            if (routeState?.fromLessonSetId === selectedLessonSet.id) navigate(-1);
            else navigate(lessonSetPath(selectedLessonSet.id), { replace: true });
          }}
        />
      ) : routeIsSharedSet ? (
        <SharedLessonSetImportPage
          data={sharedLessonSetData}
          onImport={(payload: LessonSetSharePayload) => {
            const imported = lessonSetsState.importSet({ title: payload.t, chordIds: payload.c });
            setLessonAnnouncement(`${imported.title} 세트를 가져왔습니다.`);
            navigate(lessonSetPath(imported.id), { replace: true });
          }}
          onCancel={handleOpenLessonSets}
        />
      ) : routeIsLessonSetList ? (
        <LessonSetListPage
          lessonSets={lessonSetsState.lessonSets}
          onCreate={handleCreateLessonSet}
          onOpen={(lessonSetId) => navigate(lessonSetPath(lessonSetId))}
          onDelete={(lessonSetId) => lessonSetsState.deleteSet(lessonSetId)}
          onBack={handleHome}
        />
      ) : lessonSetEditorMatch && selectedLessonSet ? (
        <LessonSetEditorPage
          lessonSet={selectedLessonSet}
          chords={selectedLessonSetChords}
          onBack={handleOpenLessonSets}
          onRename={(title) => lessonSetsState.renameSet(selectedLessonSet.id, title)}
          onUpdateNote={(note) => lessonSetsState.updateSetNote(selectedLessonSet.id, note)}
          onMoveChord={(fromIndex, toIndex) => {
            lessonSetsState.moveChordInSet(selectedLessonSet.id, fromIndex, toIndex);
          }}
          onRemoveChord={(chordId) => lessonSetsState.removeChordFromSet(selectedLessonSet.id, chordId)}
          onPlay={() => handleStartLessonSlideshow(selectedLessonSet.id)}
          onShare={(opener) => handleOpenShare(selectedLessonSet.id, opener)}
          onPrint={() => navigate(lessonSetPrintPath(selectedLessonSet.id), {
            state: { fromLessonSetId: selectedLessonSet.id } satisfies AppRouteState,
          })}
          onQuiz={() => navigate(`/quiz?set=${encodeURIComponent(selectedLessonSet.id)}`)}
          onDelete={() => {
            lessonSetsState.deleteSet(selectedLessonSet.id);
            navigate("/sets", { replace: true });
          }}
        />
      ) : routeIsQuiz ? (
        <QuizPage
          key={location.search}
          chords={staticChords}
          lessonSets={lessonSetsState.lessonSets}
          onBack={handleHome}
          initialLessonSetId={new URLSearchParams(location.search).get("set") ?? undefined}
        />
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
          onRequestAddToSet={handleRequestAddToSet}
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
      {addToSetChord ? (
        <AddToLessonSetDialog
          chord={addToSetChord}
          lessonSets={lessonSetsState.lessonSets}
          onAdd={(lessonSetId) => {
            const lessonSet = lessonSetsState.lessonSets.find(({ id }) => id === lessonSetId);
            if (lessonSet?.chordIds.includes(addToSetChord.id)) {
              setLessonAnnouncement(`${addToSetChord.displayName} 코드는 이미 ${lessonSet.title}에 있습니다.`);
              handleCloseAddToSet();
              return;
            }
            lessonSetsState.addChordToSet(lessonSetId, addToSetChord.id);
            setLessonAnnouncement(`${addToSetChord.displayName} 코드를 ${lessonSet?.title ?? "수업 세트"}에 추가했습니다.`);
            handleCloseAddToSet();
          }}
          onCreateAndAdd={(title) => {
            const lessonSet = lessonSetsState.createSet({ title, chordIds: [addToSetChord.id] });
            setLessonAnnouncement(`${lessonSet.title} 세트를 만들고 ${addToSetChord.displayName} 코드를 추가했습니다.`);
            handleCloseAddToSet();
          }}
          onClose={handleCloseAddToSet}
        />
      ) : null}
      {sharingLessonSet ? (
        <LessonSetShareDialog
          lessonSet={sharingLessonSet}
          shareUrl={lessonSetShareUrl}
          onClose={handleCloseShare}
        />
      ) : null}
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {lessonAnnouncement}
      </p>
    </AppShell>
  );
}

export default App;

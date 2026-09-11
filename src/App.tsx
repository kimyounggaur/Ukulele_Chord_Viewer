import { useCallback, useMemo, useRef, useState } from "react";
import type { ChordQuality } from "./data/types";
import { staticChords } from "./data/chords";
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
import type { GridFocusRequest } from "./hooks/useRovingChordGrid";

function App() {
  useClickSound();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQualityId, setSelectedQualityId] = useState<ChordQuality | null>(null);
  const [selectedChordId, setSelectedChordId] = useState<string | null>(null);
  const [adminPageOpen, setAdminPageOpen] = useState(false);
  const [gridFocusRequest, setGridFocusRequest] = useState<GridFocusRequest | null>(null);
  const [qualityFocusRequest, setQualityFocusRequest] = useState<GridFocusRequest | null>(null);
  const focusNonceRef = useRef(0);
  const detailOriginRef = useRef<string | null>(null);
  const auth = useAuth();
  const uploadedImages = useIndexedChordImages();
  const { stageMode, toggleStageMode } = useStageMode();
  const layoutMode = useLayoutMode(stageMode);

  const selectedChord = useMemo(
    () => staticChords.find((chord) => chord.id === selectedChordId) ?? null,
    [selectedChordId],
  );

  const relatedChords = useMemo(() => {
    if (!selectedChord) {
      return [];
    }

    return staticChords.filter((chord) => chord.quality === selectedChord.quality);
  }, [selectedChord]);

  const handleHome = useCallback(() => {
    setSearchTerm("");
    setSelectedQualityId(null);
    setSelectedChordId(null);
    setAdminPageOpen(false);
    detailOriginRef.current = null;
    setGridFocusRequest(null);
    setQualityFocusRequest(null);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    if (!auth.canSearch) {
      return;
    }

    setSearchTerm(value);
    if (value.trim()) {
      setSelectedChordId(null);
      setSelectedQualityId(null);
      setAdminPageOpen(false);
      detailOriginRef.current = null;
      setGridFocusRequest(null);
    }
  }, [auth.canSearch]);

  const handleSelectQuality = useCallback((qualityId: ChordQuality) => {
    setSelectedQualityId(qualityId);
    setSelectedChordId(null);
    setQualityFocusRequest(null);
    const firstChord = staticChords.find((chord) => chord.quality === qualityId);
    if (firstChord) {
      focusNonceRef.current += 1;
      setGridFocusRequest({ id: firstChord.id, nonce: focusNonceRef.current });
    }
  }, []);

  const handleSelectChordFromGrid = useCallback((chordId: string) => {
    detailOriginRef.current = chordId;
    setSelectedChordId(chordId);
  }, []);

  const handleSelectRelatedChord = useCallback((chordId: string) => {
    setSelectedChordId(chordId);
  }, []);

  const handleBackFromDetail = useCallback(() => {
    setSelectedChordId(null);
    if (detailOriginRef.current) {
      focusNonceRef.current += 1;
      setGridFocusRequest({ id: detailOriginRef.current, nonce: focusNonceRef.current });
    }
  }, []);

  const handleBackFromGrid = useCallback(() => {
    if (selectedQualityId) {
      focusNonceRef.current += 1;
      setQualityFocusRequest({ id: selectedQualityId, nonce: focusNonceRef.current });
    }
    setSelectedChordId(null);
    setSelectedQualityId(null);
    setSearchTerm("");
    setGridFocusRequest(null);
  }, [selectedQualityId]);

  const handleOpenAdminPage = useCallback(() => {
    if (!auth.isAdmin) {
      return;
    }

    setSelectedChordId(null);
    setSelectedQualityId(null);
    setSearchTerm("");
    setAdminPageOpen(true);
  }, [auth.isAdmin]);

  const shouldShowGrid = Boolean(searchTerm.trim()) || selectedQualityId !== null;

  return (
    <AppShell
      layoutMode={layoutMode}
      header={
        <AppHeader
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          onHome={handleHome}
          onOpenAdmin={handleOpenAdminPage}
          canSearch={auth.canSearch}
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
      ) : selectedChord ? (
        <ChordDetail
          chord={selectedChord}
          relatedChords={relatedChords}
          onSelectChord={handleSelectRelatedChord}
          onBack={handleBackFromDetail}
          getUploadedImageUrl={uploadedImages.getImageUrl}
          onUploadImage={uploadedImages.uploadImage}
          onDeleteImage={uploadedImages.deleteImage}
          adminMode={auth.isAdmin}
        />
      ) : shouldShowGrid ? (
        <ChordGrid
          chords={staticChords}
          selectedQualityId={selectedQualityId}
          searchTerm={searchTerm}
          onSelectChord={handleSelectChordFromGrid}
          getUploadedImageUrl={uploadedImages.getImageUrl}
          onBack={handleBackFromGrid}
          layoutMode={layoutMode}
          focusRequest={gridFocusRequest}
        />
      ) : (
        <QualitySelector
          selectedQualityId={selectedQualityId}
          onSelectQuality={handleSelectQuality}
          focusRequest={qualityFocusRequest}
        />
      )}
    </AppShell>
  );
}

export default App;

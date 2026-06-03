import { useCallback, useMemo, useState } from "react";
import type { ChordQualityId } from "./data/chordTypes";
import { staticChords } from "./data/chords";
import { AppHeader } from "./components/AppHeader";
import { AppShell } from "./components/AppShell";
import { ChordDetail } from "./components/ChordDetail";
import { ChordGrid } from "./components/ChordGrid";
import { QualitySelector } from "./components/QualitySelector";
import { useIndexedChordImages } from "./hooks/useIndexedChordImages";

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQualityId, setSelectedQualityId] = useState<ChordQualityId | null>(null);
  const [selectedChordId, setSelectedChordId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const uploadedImages = useIndexedChordImages();

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
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    if (value.trim()) {
      setSelectedChordId(null);
    }
  }, []);

  const handleSelectQuality = useCallback((qualityId: ChordQualityId) => {
    setSelectedQualityId(qualityId);
    setSelectedChordId(null);
  }, []);

  const handleSelectChord = useCallback((chordId: string) => {
    setSelectedChordId(chordId);
  }, []);

  const handleBackFromDetail = useCallback(() => {
    setSelectedChordId(null);
  }, []);

  const handleBackFromGrid = useCallback(() => {
    setSelectedChordId(null);
    setSelectedQualityId(null);
    setSearchTerm("");
  }, []);

  const shouldShowGrid = Boolean(searchTerm.trim()) || selectedQualityId !== null;

  return (
    <AppShell
      header={
        <AppHeader
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          onHome={handleHome}
          adminMode={adminMode}
          onToggleAdmin={() => setAdminMode((current) => !current)}
        />
      }
    >
      {selectedChord ? (
        <ChordDetail
          chord={selectedChord}
          relatedChords={relatedChords}
          onSelectChord={handleSelectChord}
          onBack={handleBackFromDetail}
          getUploadedImageUrl={uploadedImages.getImageUrl}
          onUploadImage={uploadedImages.uploadImage}
          onDeleteImage={uploadedImages.deleteImage}
          adminMode={adminMode}
        />
      ) : shouldShowGrid ? (
        <ChordGrid
          chords={staticChords}
          selectedQualityId={selectedQualityId}
          searchTerm={searchTerm}
          onSelectChord={handleSelectChord}
          getUploadedImageUrl={uploadedImages.getImageUrl}
          onBack={handleBackFromGrid}
        />
      ) : (
        <QualitySelector
          selectedQualityId={selectedQualityId}
          onSelectQuality={handleSelectQuality}
        />
      )}
    </AppShell>
  );
}

export default App;

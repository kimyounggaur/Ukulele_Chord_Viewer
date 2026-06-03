import { useCallback, useEffect, useRef, useState } from "react";
import {
  deleteUploadedChordImage,
  listUploadedChordImages,
  saveUploadedChordImage,
  type UploadedChordImage,
} from "../lib/chordImageStorage";

interface UploadedImageState {
  records: UploadedChordImage[];
  urlsByChordId: Record<string, string>;
  loading: boolean;
  error: string | null;
  uploadImage: (chordId: string, file: File) => Promise<void>;
  deleteImage: (chordId: string) => Promise<void>;
  getImageUrl: (chordId: string) => string | undefined;
}

export function useIndexedChordImages(): UploadedImageState {
  const [records, setRecords] = useState<UploadedChordImage[]>([]);
  const [urlsByChordId, setUrlsByChordId] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const urlsRef = useRef<Record<string, string>>({});

  const replaceUrls = useCallback((nextRecords: UploadedChordImage[]) => {
    Object.values(urlsRef.current).forEach((url) => URL.revokeObjectURL(url));

    const nextUrls = nextRecords.reduce<Record<string, string>>((accumulator, item) => {
      accumulator[item.chordId] = URL.createObjectURL(item.blob);
      return accumulator;
    }, {});

    urlsRef.current = nextUrls;
    setUrlsByChordId(nextUrls);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const nextRecords = await listUploadedChordImages();
      setRecords(nextRecords);
      replaceUrls(nextRecords);
      setError(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "이미지를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [replaceUrls]);

  useEffect(() => {
    void refresh();

    return () => {
      Object.values(urlsRef.current).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [refresh]);

  const uploadImage = useCallback(
    async (chordId: string, file: File) => {
      await saveUploadedChordImage(chordId, file);
      await refresh();
    },
    [refresh],
  );

  const deleteImage = useCallback(
    async (chordId: string) => {
      await deleteUploadedChordImage(chordId);
      await refresh();
    },
    [refresh],
  );

  const getImageUrl = useCallback(
    (chordId: string) => urlsByChordId[chordId],
    [urlsByChordId],
  );

  return {
    records,
    urlsByChordId,
    loading,
    error,
    uploadImage,
    deleteImage,
    getImageUrl,
  };
}

import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export const DB_NAME = "ukulele-chord-viewer";
export const STORE_NAME = "chord-images";
export const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/svg+xml", "image/png", "image/webp"] as const;

export interface UploadedChordImage {
  id: string;
  chordId: string;
  fileName: string;
  mimeType: string;
  blob: Blob;
  updatedAt: number;
}

interface ChordImageDB extends DBSchema {
  "chord-images": {
    key: string;
    value: UploadedChordImage;
    indexes: { "by-chord-id": string };
  };
}

let databasePromise: Promise<IDBPDatabase<ChordImageDB>> | null = null;

function getDatabase(): Promise<IDBPDatabase<ChordImageDB>> {
  databasePromise ??= openDB<ChordImageDB>(DB_NAME, 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("by-chord-id", "chordId", { unique: true });
      }
    },
  });

  return databasePromise;
}

export function getImageFileValidationError(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
    return "svg, png, webp 파일만 사용할 수 있습니다.";
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "2MB 이하 파일만 사용할 수 있습니다.";
  }

  return null;
}

export async function saveUploadedChordImage(chordId: string, file: File): Promise<void> {
  const validationError = getImageFileValidationError(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const database = await getDatabase();
  const item: UploadedChordImage = {
    id: chordId,
    chordId,
    fileName: file.name,
    mimeType: file.type,
    blob: file,
    updatedAt: Date.now(),
  };

  await database.put(STORE_NAME, item);
}

export async function getUploadedChordImage(chordId: string): Promise<UploadedChordImage | undefined> {
  const database = await getDatabase();
  return database.get(STORE_NAME, chordId);
}

export async function getUploadedChordImageUrl(chordId: string): Promise<string | null> {
  const item = await getUploadedChordImage(chordId);
  return item ? URL.createObjectURL(item.blob) : null;
}

export async function listUploadedChordImages(): Promise<UploadedChordImage[]> {
  const database = await getDatabase();
  return database.getAll(STORE_NAME);
}

export async function deleteUploadedChordImage(chordId: string): Promise<void> {
  const database = await getDatabase();
  await database.delete(STORE_NAME, chordId);
}

// 정적 배포된 웹사이트의 public 폴더는 브라우저에서 직접 수정할 수 없다.
// 기본 이미지는 개발자가 프로젝트에 포함해 배포하고, 사용자 업로드 이미지는 IndexedDB 또는 서버 스토리지에 저장해야 한다.

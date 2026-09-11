import { staticChords } from "../data/chords";
import { toCurrentChordId } from "../storage/chordIds";
import {
  importLessonSet,
  normalizeLessonSetTitle,
  truncateCodePoints,
} from "./storage";
import type { LessonSet, LessonSetIdentity, LessonSetMutationResult } from "./types";

export const LESSON_SET_SHARE_VERSION = 1 as const;
export const MAX_SHARED_TITLE_LENGTH = 40;
export const MAX_SHARED_DATA_LENGTH = 8_192;
export const MAX_SHARED_CHORDS = staticChords.length;

export interface LessonSetSharePayload {
  v: typeof LESSON_SET_SHARE_VERSION;
  t: string;
  c: string[];
}

export class LessonSetShareError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LessonSetShareError";
  }
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  if (
    value.length === 0 ||
    value.length > MAX_SHARED_DATA_LENGTH ||
    value.length % 4 === 1 ||
    !/^[A-Za-z0-9_-]+$/.test(value)
  ) {
    throw new LessonSetShareError("공유 데이터 형식이 올바르지 않습니다.");
  }

  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  let binary: string;
  try {
    binary = atob(padded);
  } catch {
    throw new LessonSetShareError("공유 데이터를 해석할 수 없습니다.");
  }

  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  if (bytesToBase64Url(bytes) !== value) {
    throw new LessonSetShareError("공유 데이터가 정규 base64url 형식이 아닙니다.");
  }
  return bytes;
}

function validateSharedTitle(value: unknown): string {
  if (typeof value !== "string") {
    throw new LessonSetShareError("수업 세트 제목이 없습니다.");
  }
  const normalized = normalizeLessonSetTitle(value, "");
  if (
    !normalized ||
    normalized !== value ||
    Array.from(value).length > MAX_SHARED_TITLE_LENGTH
  ) {
    throw new LessonSetShareError("수업 세트 제목이 올바르지 않습니다.");
  }
  return value;
}

function validateSharedChordIds(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > MAX_SHARED_CHORDS) {
    throw new LessonSetShareError("공유된 코드 목록의 길이가 올바르지 않습니다.");
  }

  const result: string[] = [];
  const seen = new Set<string>();
  for (const candidate of value) {
    if (typeof candidate !== "string") {
      throw new LessonSetShareError("공유된 코드 ID가 올바르지 않습니다.");
    }
    const chordId = toCurrentChordId(candidate);
    if (!chordId || seen.has(chordId)) {
      throw new LessonSetShareError("알 수 없거나 중복된 코드 ID가 있습니다.");
    }
    seen.add(chordId);
    result.push(chordId);
  }
  return result;
}

function validatePayload(value: unknown): LessonSetSharePayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new LessonSetShareError("공유 데이터에 수업 세트가 없습니다.");
  }
  const candidate = value as Record<string, unknown>;
  const keys = Object.keys(candidate).sort();
  if (keys.length !== 3 || keys[0] !== "c" || keys[1] !== "t" || keys[2] !== "v") {
    throw new LessonSetShareError("지원하지 않는 공유 데이터 필드가 있습니다.");
  }
  if (candidate.v !== LESSON_SET_SHARE_VERSION) {
    throw new LessonSetShareError("지원하지 않는 수업 세트 버전입니다.");
  }
  return {
    v: LESSON_SET_SHARE_VERSION,
    t: validateSharedTitle(candidate.t),
    c: validateSharedChordIds(candidate.c),
  };
}

export function lessonSetToSharePayload(
  lessonSet: Pick<LessonSet, "title" | "chordIds">,
): LessonSetSharePayload {
  const title = truncateCodePoints(
    normalizeLessonSetTitle(lessonSet.title),
    MAX_SHARED_TITLE_LENGTH,
  );
  return validatePayload({ v: LESSON_SET_SHARE_VERSION, t: title, c: lessonSet.chordIds });
}

export function encodeLessonSetShareData(
  lessonSet: Pick<LessonSet, "title" | "chordIds">,
): string {
  const payload = lessonSetToSharePayload(lessonSet);
  const encoded = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  if (encoded.length > MAX_SHARED_DATA_LENGTH) {
    throw new LessonSetShareError("공유 링크에 담기에는 수업 세트가 너무 큽니다.");
  }
  return encoded;
}

export function decodeLessonSetShareData(data: string): LessonSetSharePayload {
  const bytes = base64UrlToBytes(data);
  let decoded: string;
  try {
    decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new LessonSetShareError("공유 데이터의 문자 인코딩이 올바르지 않습니다.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(decoded);
  } catch {
    throw new LessonSetShareError("공유 데이터가 올바른 JSON이 아닙니다.");
  }
  return validatePayload(parsed);
}

export function tryDecodeLessonSetShareData(data: string): LessonSetSharePayload | null {
  try {
    return decodeLessonSetShareData(data);
  } catch {
    return null;
  }
}

export function importLessonSetShareData(
  data: string,
  lessonSets: readonly LessonSet[],
  identity: LessonSetIdentity = {},
): LessonSetMutationResult {
  const payload = decodeLessonSetShareData(data);
  return importLessonSet(
    lessonSets,
    { title: payload.t, chordIds: payload.c },
    identity,
  );
}

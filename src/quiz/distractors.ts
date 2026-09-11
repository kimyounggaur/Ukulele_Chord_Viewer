import type { Chord } from "../data/types";

export interface VoicingDistance {
  hamming: number;
  delta: number;
}

export interface DistractorOptions {
  /** Full SSOT pool used to supplement a lesson-set scope and resolve source order. */
  allChords?: readonly Chord[];
  count?: number;
}

const INFINITE_DISTANCE: VoicingDistance = {
  hamming: Number.POSITIVE_INFINITY,
  delta: Number.POSITIVE_INFINITY,
};

export function fretHamming(
  first: readonly number[],
  second: readonly number[],
): number {
  const length = Math.max(first.length, second.length);
  let differenceCount = 0;

  for (let index = 0; index < length; index += 1) {
    if (first[index] !== second[index]) differenceCount += 1;
  }

  return differenceCount;
}

export function fretDelta(first: readonly number[], second: readonly number[]): number {
  const length = Math.max(first.length, second.length);
  let distance = 0;

  for (let index = 0; index < length; index += 1) {
    // Missing strings behave like muted strings. Chord data normally has four entries,
    // but this keeps the pure helper deterministic for malformed imported data too.
    distance += Math.abs((first[index] ?? -1) - (second[index] ?? -1));
  }

  return distance;
}

function compareDistance(first: VoicingDistance, second: VoicingDistance): number {
  return first.hamming - second.hamming || first.delta - second.delta;
}

export function minVoicingDistance(first: Chord, second: Chord): VoicingDistance {
  let closest = INFINITE_DISTANCE;

  for (const firstVoicing of first.voicings) {
    for (const secondVoicing of second.voicings) {
      const distance = {
        hamming: fretHamming(firstVoicing.frets, secondVoicing.frets),
        delta: fretDelta(firstVoicing.frets, secondVoicing.frets),
      };
      if (compareDistance(distance, closest) < 0) closest = distance;
    }
  }

  return closest;
}

export function fretSignature(frets: readonly number[]): string {
  return frets.join(",");
}

export function chordVoicingSignatures(chord: Chord): readonly string[] {
  return chord.voicings.map((voicing) => fretSignature(voicing.frets));
}

export function sharesVoicingSignature(first: Chord, second: Chord): boolean {
  const firstSignatures = new Set(chordVoicingSignatures(first));
  return chordVoicingSignatures(second).some((signature) => firstSignatures.has(signature));
}

export function hasAmbiguousVoicing(chord: Chord, allChords: readonly Chord[]): boolean {
  return allChords.some(
    (candidate) => candidate.id !== chord.id && sharesVoicingSignature(chord, candidate),
  );
}

function uniqueCandidates(answer: Chord, candidates: readonly Chord[]): Chord[] {
  const seenIds = new Set([answer.id]);
  const result: Chord[] = [];

  for (const candidate of candidates) {
    if (seenIds.has(candidate.id) || sharesVoicingSignature(answer, candidate)) continue;
    seenIds.add(candidate.id);
    result.push(candidate);
  }

  return result;
}

function buildSourceIndices(allChords: readonly Chord[], scopedChords: readonly Chord[]) {
  const indices = new Map<string, number>();
  allChords.forEach((chord, index) => {
    if (!indices.has(chord.id)) indices.set(chord.id, index);
  });
  scopedChords.forEach((chord, index) => {
    if (!indices.has(chord.id)) indices.set(chord.id, allChords.length + index);
  });
  return indices;
}

function compareSimilarity(
  answer: Chord,
  sourceIndices: ReadonlyMap<string, number>,
  first: Chord,
  second: Chord,
): number {
  const firstDistance = minVoicingDistance(answer, first);
  const secondDistance = minVoicingDistance(answer, second);

  return (
    compareDistance(firstDistance, secondDistance) ||
    Number(second.quality === answer.quality) - Number(first.quality === answer.quality) ||
    (sourceIndices.get(first.id) ?? Number.MAX_SAFE_INTEGER) -
      (sourceIndices.get(second.id) ?? Number.MAX_SAFE_INTEGER)
  );
}

function isUniqueChoice(candidate: Chord, selected: readonly Chord[]): boolean {
  return selected.every((choice) => !sharesVoicingSignature(choice, candidate));
}

function fillDistractors(
  answer: Chord,
  candidates: readonly Chord[],
  count: number,
  sourceIndices: ReadonlyMap<string, number>,
  initialSelected: readonly Chord[] = [],
): Chord[] {
  const sorted = [...candidates].sort((first, second) =>
    compareSimilarity(answer, sourceIndices, first, second),
  );
  const selected = [...initialSelected];

  const takeFirst = (predicate: (candidate: Chord) => boolean) => {
    const candidate = sorted.find(
      (item) =>
        !selected.some((choice) => choice.id === item.id) &&
        isUniqueChoice(item, [answer, ...selected]) &&
        predicate(item),
    );
    if (candidate) selected.push(candidate);
  };

  if (!selected.some((candidate) => candidate.root === answer.root && candidate.quality !== answer.quality)) {
    takeFirst((candidate) => candidate.root === answer.root && candidate.quality !== answer.quality);
  }
  if (
    selected.length < count &&
    !selected.some((candidate) => minVoicingDistance(answer, candidate).hamming === 1)
  ) {
    takeFirst((candidate) => minVoicingDistance(answer, candidate).hamming === 1);
  }

  for (const candidate of sorted) {
    if (selected.length >= count) break;
    if (selected.some((choice) => choice.id === candidate.id)) continue;
    if (!isUniqueChoice(candidate, [answer, ...selected])) continue;
    selected.push(candidate);
  }

  return selected;
}

/**
 * Picks stable, intentionally confusing wrong answers.
 *
 * Priority is one same-root/different-quality chord, then one one-string-different
 * chord, followed by hamming distance, fret delta, same quality and SSOT order.
 * The full pool supplements a lesson-set pool that cannot make four choices.
 */
export function getDistractors(
  answer: Chord,
  scopedCandidates: readonly Chord[],
  optionsOrAllChords: DistractorOptions | readonly Chord[] = {},
  legacyCount?: number,
): Chord[] {
  const options: DistractorOptions = Array.isArray(optionsOrAllChords)
    ? { allChords: optionsOrAllChords, count: legacyCount }
    : (optionsOrAllChords as DistractorOptions);
  const allChords = options.allChords ?? scopedCandidates;
  const count = Math.max(0, Math.floor(options.count ?? 3));
  if (count === 0) return [];

  const sourceIndices = buildSourceIndices(allChords, scopedCandidates);
  const scoped = fillDistractors(
    answer,
    uniqueCandidates(answer, scopedCandidates),
    count,
    sourceIndices,
  );
  if (scoped.length >= count) return scoped;

  return fillDistractors(
    answer,
    uniqueCandidates(answer, allChords),
    count,
    sourceIndices,
    scoped,
  );
}

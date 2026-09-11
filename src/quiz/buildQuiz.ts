import type { Chord } from "../data/types";
import {
  getDistractors,
  hasAmbiguousVoicing,
} from "./distractors";
import type {
  BuildQuizOptions,
  QuizAnswerResult,
  QuizChoiceIds,
  QuizChoices,
  QuizQuestion,
  QuizQuestionType,
  QuizResult,
  QuizScope,
  QuizSelections,
} from "./types";

export const DEFAULT_QUIZ_QUESTION_COUNT = 10;

function uniqueById(chords: readonly Chord[]): Chord[] {
  const seen = new Set<string>();
  return chords.filter((chord) => {
    if (seen.has(chord.id)) return false;
    seen.add(chord.id);
    return true;
  });
}

export function getQuizScopeChords(
  allChords: readonly Chord[],
  scope: QuizScope = { kind: "all" },
): Chord[] {
  const uniqueChords = uniqueById(allChords);
  if (scope.kind === "all") return uniqueChords;
  if (scope.kind === "quality") {
    return uniqueChords.filter((chord) => chord.quality === scope.quality);
  }

  const chordsById = new Map(uniqueChords.map((chord) => [chord.id, chord]));
  const seen = new Set<string>();
  return scope.chordIds.flatMap((id) => {
    if (seen.has(id)) return [];
    seen.add(id);
    const chord = chordsById.get(id);
    return chord ? [chord] : [];
  });
}

export function getEligibleQuizAnswers(
  type: QuizQuestionType,
  scopedChords: readonly Chord[],
  allChords: readonly Chord[],
): Chord[] {
  const candidates = uniqueById(scopedChords);
  if (type === "name-to-diagram") return candidates;

  // A diagram or rendered voicing sound cannot distinguish two names that share
  // the exact same fingering. Excluding those answers keeps every question fair.
  return candidates.filter((chord) => !hasAmbiguousVoicing(chord, allChords));
}

function seedToUint32(seed: string): number {
  let value = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    value ^= seed.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function createSeededRandom(seed: string): () => number {
  let state = seedToUint32(seed) || 0x9e3779b9;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function deterministicShuffle<T>(values: readonly T[], seed: string | number): T[] {
  const result = [...values];
  const random = createSeededRandom(String(seed));

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

function asChoices(chords: readonly Chord[]): QuizChoices | null {
  return chords.length === 4 ? (chords as unknown as QuizChoices) : null;
}

function asChoiceIds(chords: QuizChoices): QuizChoiceIds {
  return chords.map((chord) => chord.id) as unknown as QuizChoiceIds;
}

export function buildQuiz({
  chords,
  type,
  scope = { kind: "all" },
  count = DEFAULT_QUIZ_QUESTION_COUNT,
  seed = "ukv-quiz",
}: BuildQuizOptions): QuizQuestion[] {
  const allChords = uniqueById(chords);
  const scopedChords = getQuizScopeChords(allChords, scope);
  const eligibleAnswers = getEligibleQuizAnswers(type, scopedChords, allChords);
  const requestedCount = Math.max(0, Math.floor(count));
  if (eligibleAnswers.length === 0 || requestedCount === 0) return [];

  const questions: QuizQuestion[] = [];

  for (let index = 0; index < requestedCount; index += 1) {
    const answer = eligibleAnswers[index % eligibleAnswers.length];
    const distractors = getDistractors(answer, scopedChords, {
      allChords,
      count: 3,
    });
    if (distractors.length < 3) continue;

    const questionSeed = `${String(seed)}:${type}:${answer.id}:${index}`;
    const choices = asChoices(deterministicShuffle([answer, ...distractors], questionSeed));
    if (!choices) continue;

    questions.push({
      id: `${type}:${answer.id}:${index}`,
      index: questions.length,
      type,
      answer,
      answerChordId: answer.id,
      choices,
      choiceChordIds: asChoiceIds(choices),
      seed: questionSeed,
    });
  }

  return questions;
}

export function evaluateQuiz(
  questions: readonly QuizQuestion[],
  selections: QuizSelections,
): QuizResult {
  const answers: QuizAnswerResult[] = questions.map((question) => {
    const selectedChordId = selections[question.id] ?? null;
    return {
      question,
      selectedChordId,
      isCorrect: selectedChordId === question.answerChordId,
    };
  });
  const correctCount = answers.filter((answer) => answer.isCorrect).length;
  const incorrectQuestions = answers
    .filter((answer) => !answer.isCorrect)
    .map((answer) => answer.question);
  const incorrectChordIds = [
    ...new Set(incorrectQuestions.map((question) => question.answerChordId)),
  ];
  const accuracy = questions.length === 0 ? 0 : correctCount / questions.length;

  return {
    answers,
    total: questions.length,
    correctCount,
    incorrectCount: questions.length - correctCount,
    accuracy,
    accuracyPercent: Math.round(accuracy * 100),
    incorrectQuestions,
    incorrectChordIds,
  };
}

/** Creates a new deterministic attempt containing only the missed questions. */
export function buildRetryQuiz(result: QuizResult, seed: string | number = "retry"): QuizQuestion[] {
  return result.incorrectQuestions.map((question, index) => {
    const questionSeed = `${String(seed)}:${question.type}:${question.answerChordId}:${index}`;
    const choices = deterministicShuffle(question.choices, questionSeed) as unknown as QuizChoices;
    return {
      ...question,
      id: `${question.type}:${question.answerChordId}:retry:${index}`,
      index,
      choices,
      choiceChordIds: asChoiceIds(choices),
      seed: questionSeed,
    };
  });
}

export const scoreQuiz = evaluateQuiz;
export const retryIncorrectQuestions = buildRetryQuiz;


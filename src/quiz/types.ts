import type { Chord, ChordQuality } from "../data/types";

export const QUIZ_QUESTION_TYPES = [
  "diagram-to-name",
  "name-to-diagram",
  "sound-to-name",
] as const;

export type QuizQuestionType = (typeof QUIZ_QUESTION_TYPES)[number];

export type QuizScope =
  | { kind: "all" }
  | { kind: "quality"; quality: ChordQuality }
  | { kind: "set"; chordIds: readonly string[] };

export interface BuildQuizOptions {
  chords: readonly Chord[];
  type: QuizQuestionType;
  scope?: QuizScope;
  /** Number of questions to create. Small scopes repeat in their original order. */
  count?: number;
  /** Only choice order depends on this seed; answer and distractor selection stay stable. */
  seed?: string | number;
}

export type QuizChoices = readonly [Chord, Chord, Chord, Chord];
export type QuizChoiceIds = readonly [string, string, string, string];

export interface QuizQuestion {
  id: string;
  index: number;
  type: QuizQuestionType;
  answer: Chord;
  answerChordId: string;
  choices: QuizChoices;
  choiceChordIds: QuizChoiceIds;
  seed: string;
}

export type QuizSelections = Readonly<Record<string, string | null | undefined>>;

export interface QuizAnswerResult {
  question: QuizQuestion;
  selectedChordId: string | null;
  isCorrect: boolean;
}

export interface QuizResult {
  answers: readonly QuizAnswerResult[];
  total: number;
  correctCount: number;
  incorrectCount: number;
  /** A zero-to-one ratio, suitable for progress bars. */
  accuracy: number;
  /** Rounded whole-number percentage, suitable for result copy. */
  accuracyPercent: number;
  incorrectQuestions: readonly QuizQuestion[];
  /** De-duplicated in first-missed order. */
  incorrectChordIds: readonly string[];
}


import assert from "node:assert/strict";
import { buildQuiz, buildRetryQuiz, evaluateQuiz } from "../src/quiz/buildQuiz";
import {
  fretDelta,
  fretHamming,
  getDistractors,
  hasAmbiguousVoicing,
  minVoicingDistance,
  sharesVoicingSignature,
} from "../src/quiz/distractors";
import type { Chord, ChordQuality } from "../src/data/types";

function chord(
  id: string,
  root: string,
  quality: ChordQuality,
  frets: readonly [number, number, number, number],
): Chord {
  return {
    id,
    root,
    quality,
    displayName: id,
    koreanName: id,
    notes: [],
    voicings: [
      {
        frets: [...frets],
        fingers: [0, 0, 0, 0],
        baseFret: 1,
        difficulty: 1,
      },
    ],
  };
}

const answer = chord("C", "C", "major", [0, 0, 0, 3]);
const sameRoot = chord("Cm", "C", "minor", [0, 3, 3, 3]);
const oneString = chord("G7", "G", "dom7", [0, 0, 0, 1]);
const nearestSameQuality = chord("D", "D", "major", [0, 0, 2, 2]);
const nearestOtherQuality = chord("Em", "E", "minor", [0, 2, 0, 2]);
const farther = chord("F", "F", "major", [2, 0, 1, 0]);
const duplicateAnswerShape = chord("Am7", "A", "min7", [0, 0, 0, 3]);
const duplicateId = chord("Cm", "C", "minor", [4, 4, 4, 4]);

assert.equal(fretHamming([0, 0, 0, 3], [0, 0, 2, 3]), 1, "프렛 hamming");
assert.equal(fretDelta([0, 0, 0, 3], [0, 0, 2, 3]), 2, "프렛 delta");
assert.deepEqual(
  minVoicingDistance(answer, nearestSameQuality),
  { hamming: 2, delta: 3 },
  "가장 가까운 운지 거리",
);

const rankedPool = [
  answer,
  farther,
  nearestOtherQuality,
  sameRoot,
  nearestSameQuality,
  oneString,
  duplicateAnswerShape,
  duplicateId,
];
const distractors = getDistractors(answer, rankedPool);
assert.equal(distractors.length, 3, "오답은 세 개");
assert.equal(distractors[0]?.id, sameRoot.id, "같은 루트·다른 성질을 먼저 한 개 선택");
assert.equal(distractors[1]?.id, oneString.id, "프렛 한 줄 차이를 다음으로 선택");
assert.equal(
  distractors[2]?.id,
  nearestSameQuality.id,
  "나머지는 hamming→delta→같은 성질→원본 순서로 선택",
);
assert.ok(distractors.every((candidate) => candidate.id !== answer.id), "정답 id 제외");
assert.equal(new Set(distractors.map((candidate) => candidate.id)).size, 3, "오답 id 고유");
assert.ok(
  distractors.every((candidate) => !sharesVoicingSignature(answer, candidate)),
  "정답과 같은 운지는 보기에서 제외",
);
assert.ok(!distractors.some((candidate) => candidate === duplicateId), "중복 id 제외");

assert.equal(hasAmbiguousVoicing(answer, rankedPool), true, "동일 운지 정답 모호성 감지");

const scopeA = chord("A", "A", "major", [2, 1, 0, 0]);
const scopeD = chord("Dm", "D", "minor", [2, 2, 1, 0]);
const scopeE = chord("E7", "E", "dom7", [1, 2, 0, 2]);
const supplement = chord("Fsus4", "F", "sus4", [3, 0, 1, 1]);
const allChords = [scopeA, scopeD, scopeE, supplement, sameRoot, oneString, farther];
const quizOptions = {
  chords: allChords,
  type: "name-to-diagram" as const,
  scope: { kind: "set" as const, chordIds: [scopeA.id, scopeD.id, scopeE.id] },
  seed: "class-1",
};
const firstQuiz = buildQuiz(quizOptions);
const secondQuiz = buildQuiz(quizOptions);

assert.equal(firstQuiz.length, 10, "기본 문제 수는 10개");
assert.ok(firstQuiz.every((question) => question.choices.length === 4), "3코드 세트도 4지선다");
assert.ok(
  firstQuiz.every((question) => question.choices.some((choice) => !quizOptions.scope.chordIds.includes(choice.id))),
  "3코드 세트의 오답은 전체 데이터로 보충",
);
assert.ok(
  firstQuiz.every(
    (question) =>
      question.choices.filter((choice) => !quizOptions.scope.chordIds.includes(choice.id)).length === 1,
  ),
  "3코드 세트는 부족한 보기 한 개만 전체 데이터로 보충",
);

const fourChordIds = [scopeA.id, scopeD.id, scopeE.id, supplement.id];
const fourChordScopeQuiz = buildQuiz({
  chords: allChords,
  type: "name-to-diagram",
  scope: { kind: "set", chordIds: fourChordIds },
  count: 4,
  seed: "class-4",
});
assert.equal(fourChordScopeQuiz.length, 4, "4코드 세트는 네 문제를 생성");
assert.ok(
  fourChordScopeQuiz.every((question) =>
    question.choiceChordIds.every((choiceId) => fourChordIds.includes(choiceId)),
  ),
  "후보가 4개 이상인 세트는 모든 보기를 세트 범위 안에서 선택",
);
assert.deepEqual(
  firstQuiz.map((question) => question.choiceChordIds),
  secondQuiz.map((question) => question.choiceChordIds),
  "같은 seed의 보기 순서는 결정적",
);

const alternateSeedQuiz = buildQuiz({ ...quizOptions, seed: "class-2" });
assert.ok(
  alternateSeedQuiz.some(
    (question, index) =>
      question.choiceChordIds.join("|") !== firstQuiz[index]?.choiceChordIds.join("|"),
  ),
  "다른 seed는 적어도 한 문제의 보기 순서를 바꿈",
);

const ambiguousDiagramQuiz = buildQuiz({
  chords: [answer, duplicateAnswerShape, scopeA, scopeD, scopeE, supplement, farther],
  type: "diagram-to-name",
  count: 6,
});
assert.ok(
  ambiguousDiagramQuiz.every(
    (question) => question.answerChordId !== answer.id && question.answerChordId !== duplicateAnswerShape.id,
  ),
  "다이어그램 문제에서 같은 운지의 모호한 정답 제외",
);

const ambiguousSoundQuiz = buildQuiz({
  chords: [answer, duplicateAnswerShape, scopeA, scopeD, scopeE, supplement, farther],
  type: "sound-to-name",
  count: 6,
});
assert.ok(
  ambiguousSoundQuiz.every(
    (question) => question.answerChordId !== answer.id && question.answerChordId !== duplicateAnswerShape.id,
  ),
  "소리 문제에서 같은 운지의 모호한 정답 제외",
);

const selections = Object.fromEntries(
  firstQuiz.map((question, index) => [
    question.id,
    index % 2 === 0
      ? question.answerChordId
      : question.choiceChordIds.find((id) => id !== question.answerChordId),
  ]),
);
const result = evaluateQuiz(firstQuiz, selections);
const retry = buildRetryQuiz(result, "retry-1");

assert.equal(result.correctCount, 5, "결과 정답 수");
assert.equal(result.accuracyPercent, 50, "정답률");
assert.equal(retry.length, 5, "재도전은 오답 문제만 포함");
assert.deepEqual(
  retry.map((question) => question.answerChordId),
  result.incorrectQuestions.map((question) => question.answerChordId),
  "재도전 정답은 틀린 문제와 동일",
);

console.log("✓ 퀴즈 유사 오답·공정성·결정성·범위 보충·오답 재도전 검사 통과");

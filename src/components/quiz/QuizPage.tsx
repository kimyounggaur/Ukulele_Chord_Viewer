import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowLeft, RotateCcw, Volume2 } from "lucide-react";
import { useChordAudio } from "../../audio/ChordAudioProvider";
import { voicingToMidi } from "../../audio/chordToNotes";
import { strum } from "../../audio/engine";
import { chordQualities } from "../../data/chordQualities";
import type { Chord, ChordQuality } from "../../data/types";
import { getChordDisplayTitle } from "../../lib/chordDisplay";
import type { LessonSet } from "../../lessonSets/types";
import {
  buildQuiz,
  buildRetryQuiz,
  evaluateQuiz,
} from "../../quiz/buildQuiz";
import type {
  QuizQuestion,
  QuizQuestionType,
  QuizResult,
  QuizScope,
  QuizSelections,
} from "../../quiz/types";
import { ChordDiagram } from "../ChordDiagram";

export interface QuizPageProps {
  chords: Chord[];
  lessonSets: LessonSet[];
  onBack: () => void;
  initialLessonSetId?: string;
}

type QuizView = "setup" | "questions" | "result";
type ScopeKind = QuizScope["kind"];

const QUESTION_TYPE_OPTIONS: readonly {
  value: QuizQuestionType;
  label: string;
  description: string;
}[] = [
  {
    value: "diagram-to-name",
    label: "다이어그램 → 이름",
    description: "운지 그림을 보고 코드 이름을 맞혀요.",
  },
  {
    value: "name-to-diagram",
    label: "이름 → 다이어그램",
    description: "코드 이름에 맞는 운지 그림을 골라요.",
  },
  {
    value: "sound-to-name",
    label: "소리 → 이름",
    description: "코드 소리를 듣고 이름을 맞혀요.",
  },
];

const SCOPE_OPTIONS: readonly { value: ScopeKind; label: string; description: string }[] = [
  { value: "all", label: "전체", description: "모든 코드에서 출제" },
  { value: "quality", label: "성질", description: "선택한 코드 성질에서 출제" },
  { value: "set", label: "수업 세트", description: "저장한 수업 세트에서 출제" },
];

const STRUM_SPREAD_MS = { slow: 55, normal: 28, fast: 15 } as const;

function describeFrets(chord: Chord): string {
  const voicing = chord.voicings[0];
  if (!voicing) return "운지 정보 없음";
  const strings = ["G줄", "C줄", "E줄", "A줄"];
  return voicing.frets
    .map((fret, index) => {
      if (fret < 0) return `${strings[index]} 뮤트`;
      if (fret === 0) return `${strings[index]} 개방현`;
      return `${strings[index]} ${fret}프렛`;
    })
    .join(", ");
}

function buildScope(
  kind: ScopeKind,
  quality: ChordQuality,
  lessonSetId: string,
  lessonSets: readonly LessonSet[],
): QuizScope | null {
  if (kind === "all") return { kind: "all" };
  if (kind === "quality") return { kind: "quality", quality };
  const lessonSet = lessonSets.find((candidate) => candidate.id === lessonSetId);
  return lessonSet ? { kind: "set", chordIds: lessonSet.chordIds } : null;
}

function choiceClassName(
  question: QuizQuestion,
  choice: Chord,
  selectedChordId: string | null,
): string {
  const base =
    "quiz-choice min-h-14 rounded-2xl border-2 bg-white p-3 text-stone-700 shadow-neo transition hover:-translate-y-0.5";
  if (!selectedChordId) return `${base} border-stone-200`;
  if (choice.id === question.answerChordId) {
    return `${base} quiz-choice-correct border-emerald-500 bg-emerald-50 text-emerald-900`;
  }
  if (choice.id === selectedChordId) {
    return `${base} quiz-choice-incorrect border-rose-500 bg-rose-50 text-rose-900`;
  }
  return `${base} quiz-choice-dimmed border-stone-200 opacity-70`;
}

export function QuizPage({ chords, lessonSets, onBack, initialLessonSetId }: QuizPageProps) {
  const hasInitialLessonSet = lessonSets.some((lessonSet) => lessonSet.id === initialLessonSetId);
  const [view, setView] = useState<QuizView>("setup");
  const [questionType, setQuestionType] = useState<QuizQuestionType>("diagram-to-name");
  const [scopeKind, setScopeKind] = useState<ScopeKind>(hasInitialLessonSet ? "set" : "all");
  const availableQualities = useMemo(
    () => chordQualities.filter((quality) => chords.some((chord) => chord.quality === quality.id)),
    [chords],
  );
  const [quality, setQuality] = useState<ChordQuality>(availableQualities[0]?.id ?? "major");
  const [lessonSetId, setLessonSetId] = useState(
    hasInitialLessonSet && initialLessonSetId ? initialLessonSetId : (lessonSets[0]?.id ?? ""),
  );
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selections, setSelections] = useState<QuizSelections>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [setupMessage, setSetupMessage] = useState("");
  const [soundStatus, setSoundStatus] = useState("");
  const seedCounterRef = useRef(0);
  const initialLessonSetAppliedRef = useRef(hasInitialLessonSet);
  const pageHeadingRef = useRef<HTMLHeadingElement>(null);
  const questionHeadingRef = useRef<HTMLHeadingElement>(null);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  const setupHeadingId = useId();
  const typeLegendId = useId();
  const scopeLegendId = useId();
  const { available: audioAvailable, settings: audioSettings } = useChordAudio();

  const effectiveQuality = availableQualities.some((item) => item.id === quality)
    ? quality
    : (availableQualities[0]?.id ?? "major");
  const effectiveLessonSetId = lessonSets.some((set) => set.id === lessonSetId)
    ? lessonSetId
    : (lessonSets[0]?.id ?? "");
  const currentQuestion = questions[currentIndex];
  const selectedChordId = currentQuestion ? selections[currentQuestion.id] ?? null : null;

  useEffect(() => {
    if (view === "questions") questionHeadingRef.current?.focus();
    else if (view === "result") resultHeadingRef.current?.focus();
    else pageHeadingRef.current?.focus();
  }, [currentIndex, view]);

  useEffect(() => {
    if (
      view !== "setup" ||
      initialLessonSetAppliedRef.current ||
      !initialLessonSetId ||
      !lessonSets.some((lessonSet) => lessonSet.id === initialLessonSetId)
    ) {
      return;
    }

    initialLessonSetAppliedRef.current = true;
    setScopeKind("set");
    setLessonSetId(initialLessonSetId);
    setSetupMessage("");
  }, [initialLessonSetId, lessonSets, view]);

  const beginAttempt = (nextQuestions: QuizQuestion[]) => {
    if (nextQuestions.length === 0) {
      setSetupMessage(
        "이 범위에서는 공정한 4지선다 문제를 만들 수 없습니다. 코드가 더 많은 범위를 선택해 주세요.",
      );
      return;
    }
    setQuestions(nextQuestions);
    setSelections({});
    setCurrentIndex(0);
    setResult(null);
    setSoundStatus("");
    setSetupMessage("");
    setView("questions");
  };

  const handleStart = () => {
    if (chords.length === 0) {
      setSetupMessage("퀴즈에 사용할 코드가 없습니다.");
      return;
    }
    if (questionType === "sound-to-name" && !audioAvailable) {
      setSetupMessage("이 브라우저에서는 소리 듣기 퀴즈를 사용할 수 없습니다.");
      return;
    }
    const scope = buildScope(
      scopeKind,
      effectiveQuality,
      effectiveLessonSetId,
      lessonSets,
    );
    if (!scope) {
      setSetupMessage("사용할 수업 세트를 먼저 선택해 주세요.");
      return;
    }

    seedCounterRef.current += 1;
    beginAttempt(
      buildQuiz({
        chords,
        type: questionType,
        scope,
        seed: `quiz-attempt-${seedCounterRef.current}`,
      }),
    );
  };

  const handleChoice = (chordId: string) => {
    if (!currentQuestion || selectedChordId) return;
    setSelections((current) => ({ ...current, [currentQuestion.id]: chordId }));
  };

  const handleNext = () => {
    if (!currentQuestion || !selectedChordId) return;
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((index) => index + 1);
      setSoundStatus("");
      return;
    }
    setResult(evaluateQuiz(questions, selections));
    setView("result");
  };

  const handleRetry = () => {
    if (!result || result.incorrectCount === 0) return;
    seedCounterRef.current += 1;
    beginAttempt(buildRetryQuiz(result, `quiz-retry-${seedCounterRef.current}`));
  };

  const handleNewQuiz = () => {
    setQuestions([]);
    setSelections({});
    setCurrentIndex(0);
    setResult(null);
    setSetupMessage("");
    setSoundStatus("");
    setView("setup");
  };

  const handlePlayQuestion = async () => {
    if (!currentQuestion || currentQuestion.type !== "sound-to-name" || !audioAvailable) return;
    if (audioSettings.volume === 0) {
      setSoundStatus("오디오 설정의 볼륨이 0%입니다.");
      return;
    }
    const voicing = currentQuestion.answer.voicings[0];
    if (!voicing) {
      setSoundStatus("이 문제의 소리를 재생할 수 없습니다.");
      return;
    }

    setSoundStatus("문제 코드를 재생합니다.");
    try {
      await strum(voicingToMidi(voicing, audioSettings.lowG), {
        spreadMs: STRUM_SPREAD_MS[audioSettings.speed],
        gain: audioSettings.volume * 0.26,
      });
      setSoundStatus("문제 코드 재생을 시작했습니다.");
    } catch {
      setSoundStatus("이 브라우저에서는 문제 소리를 재생할 수 없습니다.");
    }
  };

  const incorrectChords = useMemo(() => {
    if (!result) return [];
    const byId = new Map(chords.map((chord) => [chord.id, chord]));
    return result.incorrectChordIds.flatMap((id) => {
      const chord = byId.get(id);
      return chord ? [chord] : [];
    });
  }, [chords, result]);

  return (
    <section
      className="quiz-page screen-panel overflow-y-auto px-[clamp(14px,4vw,52px)] pb-10"
      aria-labelledby={setupHeadingId}
    >
      <header className="quiz-header sticky top-0 z-10 mx-auto flex w-full max-w-5xl items-center gap-3 bg-white/95 py-3 backdrop-blur">
        <button
          type="button"
          className="quiz-back-button inline-flex min-h-11 items-center gap-2 rounded-full border border-rose-100 bg-white px-4 font-bold text-stone-600 shadow-neo"
          onClick={onBack}
        >
          <ArrowLeft aria-hidden="true" size={18} />
          돌아가기
        </button>
        <div className="quiz-header-copy min-w-0">
          <h1
            ref={pageHeadingRef}
            id={setupHeadingId}
            tabIndex={-1}
            className="quiz-title font-display text-2xl font-bold text-stone-800 sm:text-3xl"
          >
            코드 퀴즈
          </h1>
          <p className="quiz-subtitle text-sm font-semibold text-stone-500">
            {view === "setup" ? "유형과 범위를 선택하세요." : "헷갈리는 코드를 귀와 눈으로 익혀요."}
          </p>
        </div>
      </header>

      {view === "setup" ? (
        <div className="quiz-setup mx-auto grid w-full max-w-5xl gap-6 py-5 lg:grid-cols-2">
          <fieldset className="quiz-setup-section rounded-3xl border border-stone-200 bg-white p-5 shadow-neo">
            <legend id={typeLegendId} className="quiz-setup-legend px-2 text-lg font-black text-stone-800">
              1. 문제 유형
            </legend>
            <div className="quiz-radio-list grid gap-3" aria-labelledby={typeLegendId}>
              {QUESTION_TYPE_OPTIONS.map((option) => {
                const disabled = option.value === "sound-to-name" && !audioAvailable;
                return (
                  <label
                    key={option.value}
                    className={`quiz-radio-card flex min-h-20 items-start gap-3 rounded-2xl border-2 p-4 ${
                      questionType === option.value
                        ? "border-pink-400 bg-pink-50"
                        : "border-stone-200 bg-white"
                    } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                  >
                    <input
                      type="radio"
                      name="quiz-question-type"
                      value={option.value}
                      checked={questionType === option.value}
                      disabled={disabled}
                      onChange={() => {
                        setQuestionType(option.value);
                        setSetupMessage("");
                      }}
                    />
                    <span className="quiz-radio-copy">
                      <strong className="quiz-radio-label block text-stone-800">{option.label}</strong>
                      <span className="quiz-radio-description mt-1 block text-sm text-stone-500">
                        {option.description}
                        {disabled ? " 현재 브라우저에서는 사용할 수 없어요." : ""}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="quiz-setup-section rounded-3xl border border-stone-200 bg-white p-5 shadow-neo">
            <legend id={scopeLegendId} className="quiz-setup-legend px-2 text-lg font-black text-stone-800">
              2. 출제 범위
            </legend>
            <div className="quiz-radio-list grid gap-3" aria-labelledby={scopeLegendId}>
              {SCOPE_OPTIONS.map((option) => {
                const disabled = option.value === "set" && lessonSets.length === 0;
                return (
                  <label
                    key={option.value}
                    className={`quiz-radio-card flex min-h-16 items-start gap-3 rounded-2xl border-2 p-4 ${
                      scopeKind === option.value
                        ? "border-violet-400 bg-violet-50"
                        : "border-stone-200 bg-white"
                    } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                  >
                    <input
                      type="radio"
                      name="quiz-scope"
                      value={option.value}
                      checked={scopeKind === option.value}
                      disabled={disabled}
                      onChange={() => {
                        setScopeKind(option.value);
                        setSetupMessage("");
                      }}
                    />
                    <span className="quiz-radio-copy">
                      <strong className="quiz-radio-label block text-stone-800">{option.label}</strong>
                      <span className="quiz-radio-description mt-1 block text-sm text-stone-500">
                        {option.description}
                        {disabled ? " 저장된 세트가 없어요." : ""}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>

            {scopeKind === "quality" ? (
              <label className="quiz-select-label mt-4 block font-bold text-stone-700">
                코드 성질
                <select
                  className="quiz-select mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3"
                  value={effectiveQuality}
                  disabled={availableQualities.length === 0}
                  onChange={(event) => setQuality(event.target.value as ChordQuality)}
                >
                  {availableQualities.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label} · {chords.filter((chord) => chord.quality === item.id).length}개
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {scopeKind === "set" ? (
              <label className="quiz-select-label mt-4 block font-bold text-stone-700">
                수업 세트
                <select
                  className="quiz-select mt-2 min-h-12 w-full rounded-xl border border-stone-300 bg-white px-3"
                  value={effectiveLessonSetId}
                  disabled={lessonSets.length === 0}
                  onChange={(event) => setLessonSetId(event.target.value)}
                >
                  {lessonSets.map((set) => (
                    <option key={set.id} value={set.id}>
                      {set.title} · {set.chordIds.length}개
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </fieldset>

          <div className="quiz-start-panel lg:col-span-2">
            <p className="quiz-question-count mb-3 text-center text-sm font-bold text-stone-500">
              한 번에 10문제가 출제됩니다.
            </p>
            {setupMessage ? (
              <p
                className="quiz-setup-message mb-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-center font-bold text-amber-900"
                role="alert"
              >
                {setupMessage}
              </p>
            ) : null}
            <button
              type="button"
              className="quiz-start-button min-h-14 w-full rounded-2xl bg-stone-800 px-6 text-lg font-black text-white shadow-neo disabled:cursor-not-allowed disabled:opacity-50"
              disabled={chords.length === 0 || (scopeKind === "set" && lessonSets.length === 0)}
              onClick={handleStart}
            >
              퀴즈 시작
            </button>
          </div>
        </div>
      ) : null}

      {view === "questions" && currentQuestion ? (
        <div className="quiz-question mx-auto w-full max-w-5xl py-5">
          <div className="quiz-progress-row mb-4 flex items-center gap-3">
            <progress
              className="quiz-progress h-3 flex-1"
              value={currentIndex + 1}
              max={questions.length}
              aria-label={`퀴즈 진행, 전체 ${questions.length}문제 중 ${currentIndex + 1}번`}
            />
            <span className="quiz-progress-label shrink-0 font-black text-stone-600">
              {currentIndex + 1} / {questions.length}
            </span>
          </div>

          <article className="quiz-question-card rounded-3xl border border-stone-200 bg-white p-[clamp(16px,4vw,36px)] shadow-neumorphic">
            <h2
              ref={questionHeadingRef}
              tabIndex={-1}
              className="quiz-question-heading text-center text-xl font-black text-stone-800"
            >
              {currentQuestion.type === "diagram-to-name"
                ? "이 다이어그램의 코드 이름은?"
                : currentQuestion.type === "name-to-diagram"
                  ? `${getChordDisplayTitle(currentQuestion.answer)}의 다이어그램은?`
                  : "이 소리의 코드 이름은?"}
            </h2>

            {currentQuestion.type === "diagram-to-name" ? (
              <div
                className="quiz-prompt-diagram mx-auto my-5 h-[min(44vh,360px)] max-w-sm"
                role="img"
                aria-label={`코드 운지 다이어그램. ${describeFrets(currentQuestion.answer)}`}
              >
                <ChordDiagram
                  chord={currentQuestion.answer}
                  size="lg"
                  showNotes={false}
                  priority
                  ariaHidden
                />
              </div>
            ) : null}

            {currentQuestion.type === "name-to-diagram" ? (
              <p className="quiz-prompt-name my-5 text-center font-display text-4xl font-black text-pink-500 sm:text-5xl">
                {getChordDisplayTitle(currentQuestion.answer)}
              </p>
            ) : null}

            {currentQuestion.type === "sound-to-name" ? (
              <div className="quiz-prompt-sound my-8 grid place-items-center gap-3">
                <button
                  type="button"
                  data-chord-audio="true"
                  className="quiz-sound-button inline-flex min-h-16 items-center gap-3 rounded-full border-2 border-violet-300 bg-violet-50 px-7 text-lg font-black text-violet-900 shadow-neo"
                  aria-label="문제 코드 소리 재생"
                  disabled={!audioAvailable}
                  onClick={() => void handlePlayQuestion()}
                >
                  <Volume2 aria-hidden="true" size={28} />
                  소리 듣기
                </button>
                <p className="quiz-sound-status min-h-6 text-sm font-semibold text-stone-500" aria-live="polite">
                  {soundStatus || "필요하면 여러 번 들어도 괜찮아요."}
                </p>
              </div>
            ) : null}

            <ol className="quiz-choices grid list-none gap-3 p-0 sm:grid-cols-2" aria-label="답 선택">
              {currentQuestion.choices.map((choice, index) => {
                const choiceNumber = index + 1;
                const isSelected = selectedChordId === choice.id;
                return (
                  <li className="quiz-choice-item min-w-0" key={choice.id}>
                    <button
                      type="button"
                      className={`${choiceClassName(currentQuestion, choice, selectedChordId)} w-full ${
                        currentQuestion.type === "name-to-diagram" ? "min-h-64" : "text-lg font-black"
                      }`}
                      aria-label={
                        currentQuestion.type === "name-to-diagram"
                          ? `보기 ${choiceNumber}, ${describeFrets(choice)}`
                          : undefined
                      }
                      aria-pressed={isSelected}
                      disabled={Boolean(selectedChordId)}
                      onClick={() => handleChoice(choice.id)}
                    >
                      {currentQuestion.type === "name-to-diagram" ? (
                        <span className="quiz-diagram-choice flex h-full flex-col items-center gap-2">
                          <span className="quiz-choice-number font-black text-stone-600" aria-hidden="true">
                            보기 {choiceNumber}
                          </span>
                          <span className="quiz-choice-diagram block h-48 w-full" aria-hidden="true">
                            <ChordDiagram chord={choice} size="md" showNotes={false} ariaHidden />
                          </span>
                          {selectedChordId ? (
                            <span className="quiz-choice-answer-reveal font-black" aria-hidden="true">
                              {getChordDisplayTitle(choice)}
                            </span>
                          ) : null}
                        </span>
                      ) : (
                        <span className="quiz-choice-name">{getChordDisplayTitle(choice)}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>

            <div className="quiz-feedback-panel mt-5 min-h-24">
              {selectedChordId ? (
                <div
                  className={`quiz-feedback rounded-2xl border p-4 text-center font-bold ${
                    selectedChordId === currentQuestion.answerChordId
                      ? "quiz-feedback-correct border-emerald-300 bg-emerald-50 text-emerald-900"
                      : "quiz-feedback-incorrect border-rose-300 bg-rose-50 text-rose-900"
                  }`}
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  <p>
                    {selectedChordId === currentQuestion.answerChordId
                      ? `정답입니다. ${getChordDisplayTitle(currentQuestion.answer)}`
                      : `아쉬워요. 정답은 ${getChordDisplayTitle(currentQuestion.answer)}입니다.`}
                  </p>
                  <button
                    type="button"
                    className="quiz-next-button mt-3 min-h-11 rounded-full bg-stone-800 px-6 text-white"
                    onClick={handleNext}
                  >
                    {currentIndex === questions.length - 1 ? "결과 보기" : "다음 문제"}
                  </button>
                </div>
              ) : (
                <p className="quiz-answer-hint text-center text-sm font-semibold text-stone-500">
                  보기 하나를 선택하세요.
                </p>
              )}
            </div>
          </article>
        </div>
      ) : null}

      {view === "questions" && !currentQuestion ? (
        <div className="quiz-empty mx-auto mt-10 max-w-xl rounded-3xl border border-amber-300 bg-amber-50 p-6 text-center">
          <h2 className="quiz-empty-title text-xl font-black text-amber-900">문제를 불러올 수 없습니다</h2>
          <p className="quiz-empty-copy mt-2 text-amber-900">설정으로 돌아가 다른 범위를 골라 주세요.</p>
          <button type="button" className="quiz-empty-action mt-4 rounded-full bg-stone-800 px-5 py-3 text-white" onClick={handleNewQuiz}>
            설정으로
          </button>
        </div>
      ) : null}

      {view === "result" && result ? (
        <div className="quiz-result mx-auto w-full max-w-3xl py-7 text-center">
          <p className="quiz-result-kicker font-black text-pink-500">퀴즈 완료</p>
          <h2
            ref={resultHeadingRef}
            tabIndex={-1}
            className="quiz-result-title mt-2 text-3xl font-black text-stone-800"
          >
            정답률 {result.accuracyPercent}%
          </h2>
          <p className="quiz-result-score mt-2 text-lg font-bold text-stone-600">
            {result.total}문제 중 {result.correctCount}문제를 맞혔어요.
          </p>

          <div className="quiz-result-meter mx-auto mt-5 h-4 max-w-xl overflow-hidden rounded-full bg-stone-200" aria-hidden="true">
            <div
              className="quiz-result-meter-fill h-full rounded-full bg-emerald-500"
              style={{ width: `${result.accuracyPercent}%` }}
            />
          </div>

          <section className="quiz-missed mt-7 rounded-3xl border border-stone-200 bg-white p-5 text-left shadow-neo" aria-labelledby="quiz-missed-title">
            <h3 id="quiz-missed-title" className="quiz-missed-title text-lg font-black text-stone-800">
              {result.incorrectCount === 0 ? "모두 맞혔어요!" : "다시 볼 코드"}
            </h3>
            {incorrectChords.length > 0 ? (
              <ul className="quiz-missed-list mt-3 flex list-none flex-wrap gap-2 p-0">
                {incorrectChords.map((chord) => (
                  <li key={chord.id} className="quiz-missed-item rounded-full border border-rose-200 bg-rose-50 px-4 py-2 font-black text-rose-900">
                    {getChordDisplayTitle(chord)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="quiz-perfect-copy mt-2 text-stone-600">틀린 코드 없이 완주했습니다.</p>
            )}
          </section>

          <div className="quiz-result-actions mt-6 grid gap-3 sm:grid-cols-2">
            {result.incorrectCount > 0 ? (
              <button
                type="button"
                className="quiz-retry-button inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-pink-300 bg-pink-50 px-5 font-black text-pink-900"
                onClick={handleRetry}
              >
                <RotateCcw aria-hidden="true" size={19} />
                틀린 것만 다시
              </button>
            ) : null}
            <button
              type="button"
              className="quiz-new-button min-h-14 rounded-2xl bg-stone-800 px-5 font-black text-white"
              onClick={handleNewQuiz}
            >
              새 퀴즈
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

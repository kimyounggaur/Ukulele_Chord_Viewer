import "../../styles/phase7.css";
import { useLayoutEffect, useRef, useState } from "react";
import type { Chord } from "../../data/types";
import { getChordDisplayTitle } from "../../lib/chordDisplay";
import type { LessonSet } from "../../lessonSets/types";
import { ChordDiagram } from "../ChordDiagram";

export interface LessonPrintPageProps {
  set: LessonSet;
  chords: readonly Chord[];
  onBack: () => void;
}

interface PrintDate {
  iso: string;
  label: string;
}

const CHORDS_PER_PAGE = 9;

function getPrintDate(): PrintDate {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  return {
    iso: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    label: `${year}년 ${month}월 ${day}일`,
  };
}

function paginateChords(chords: readonly Chord[]): readonly (readonly Chord[])[] {
  if (chords.length === 0) return [[]];

  const pages: Chord[][] = [];
  for (let index = 0; index < chords.length; index += CHORDS_PER_PAGE) {
    pages.push(chords.slice(index, index + CHORDS_PER_PAGE));
  }
  return pages;
}

export function LessonPrintPage({ set, chords, onBack }: LessonPrintPageProps) {
  const [printDate] = useState(getPrintDate);
  const pages = paginateChords(chords);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true }));
    return () => window.cancelAnimationFrame(frame);
  }, [set.id]);

  return (
    <section className="lesson-print-screen" aria-labelledby="lesson-print-title">
      <div className="lesson-print-toolbar" data-print-hidden="true">
        <div>
          <p>수업용 코드표</p>
          <h1 ref={headingRef} id="lesson-print-title" tabIndex={-1}>{set.title}</h1>
        </div>
        <div className="lesson-print-toolbar-actions">
          <button type="button" onClick={onBack}>뒤로</button>
          <button type="button" onClick={() => window.print()}>인쇄</button>
        </div>
      </div>

      <div className="lesson-print-document">
        {pages.map((pageChords, pageIndex) => (
          <article
            className="lesson-print-page lesson-print-page-a4-landscape"
            data-page-size="A4"
            data-page-orientation="landscape"
            aria-label={`${set.title}, ${pageIndex + 1}페이지`}
            key={`lesson-print-page-${pageIndex}`}
          >
            <header className="lesson-print-page-header">
              <h2>{set.title}</h2>
              <time dateTime={printDate.iso}>{printDate.label}</time>
            </header>

            {pageChords.length > 0 ? (
              <ol className="lesson-print-grid" start={pageIndex * CHORDS_PER_PAGE + 1}>
                {pageChords.map((chord, chordIndex) => (
                  <li
                    className="lesson-print-chord"
                    key={`${chord.id}-${pageIndex * CHORDS_PER_PAGE + chordIndex}`}
                  >
                    <h3>{getChordDisplayTitle(chord)}</h3>
                    <div className="lesson-print-diagram">
                      <ChordDiagram chord={chord} forcePrimitive size="md" showNotes={false} />
                    </div>
                    <p className="lesson-print-notes">
                      <span>구성음</span>{" "}
                      {chord.notes.length > 0 ? chord.notes.join(" · ") : "정보 없음"}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="lesson-print-empty">이 세트에는 인쇄할 코드가 없습니다.</p>
            )}

            <footer className="lesson-print-page-footer">
              <span>{set.title}</span>
              <span aria-label={`전체 ${pages.length}페이지 중 ${pageIndex + 1}페이지`}>
                {pageIndex + 1} / {pages.length}
              </span>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}

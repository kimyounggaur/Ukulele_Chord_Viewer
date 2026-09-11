import "../../styles/phase7.css";
import { useEffect, useId, useMemo, useRef } from "react";
import { staticChords } from "../../data/chords";
import { getChordDisplayTitle } from "../../lib/chordDisplay";
import {
  tryDecodeLessonSetShareData,
  type LessonSetSharePayload,
} from "../../lessonSets/shareCodec";

const chordTitleById = new Map(
  staticChords.map((chord) => [chord.id, getChordDisplayTitle(chord)]),
);

export interface SharedLessonSetImportPageProps {
  data: string;
  onImport: (payload: LessonSetSharePayload) => void;
  onCancel: () => void;
}

export function SharedLessonSetImportPage({
  data,
  onImport,
  onCancel,
}: SharedLessonSetImportPageProps) {
  const payload = useMemo(() => tryDecodeLessonSetShareData(data), [data]);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const headingId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => headingRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [data]);

  if (!payload) {
    return (
      <section className="lesson-page lesson-import-page lesson-import-error" aria-labelledby={headingId}>
        <div className="lesson-import-card">
          <p className="lesson-import-eyebrow">수업 세트 가져오기</p>
          <h1 ref={headingRef} id={headingId} tabIndex={-1}>링크를 확인할 수 없습니다</h1>
          <p className="lesson-import-message">
            공유 링크가 손상되었거나 지원하지 않는 형식입니다. 보낸 사람에게 새 링크를 요청해 주세요.
          </p>
          <button type="button" className="lesson-import-cancel-button" onClick={onCancel}>
            코드 보기로 돌아가기
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      className="lesson-page lesson-import-page"
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
    >
      <div className="lesson-import-card">
        <p className="lesson-import-eyebrow">공유받은 수업 세트</p>
        <h1 ref={headingRef} id={headingId} tabIndex={-1}>{payload.t}</h1>
        <p id={descriptionId} className="lesson-import-message">
          이 세트를 가져오시겠습니까? 가져오면 이 브라우저의 수업 세트에 새 사본으로 저장됩니다.
        </p>

        <div className="lesson-import-summary">
          <h2>포함된 코드</h2>
          <span className="lesson-import-count">{payload.c.length}개</span>
        </div>

        {payload.c.length > 0 ? (
          <ol className="lesson-import-chord-list">
            {payload.c.map((chordId) => (
              <li key={chordId} className="lesson-import-chord-item">
                {chordTitleById.get(chordId) ?? "알 수 없는 코드"}
              </li>
            ))}
          </ol>
        ) : (
          <p className="lesson-import-empty">아직 코드가 없는 빈 수업 세트입니다.</p>
        )}

        <div className="lesson-import-actions">
          <button
            type="button"
            className="lesson-import-confirm-button"
            onClick={() => onImport(payload)}
          >
            이 세트 가져오기
          </button>
          <button type="button" className="lesson-import-cancel-button" onClick={onCancel}>
            취소
          </button>
        </div>
      </div>
    </section>
  );
}

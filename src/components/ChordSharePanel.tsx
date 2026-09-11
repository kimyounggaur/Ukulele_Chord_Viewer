import { useEffect, useId, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";

export interface ChordSharePanelProps {
  chordName: string;
  url: string;
  onClose: () => void;
  copyStatus: string;
  onCopy: () => void;
}

export function ChordSharePanel({ chordName, url, onClose, copyStatus, onCopy }: ChordSharePanelProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex='-1'])",
        ),
      );
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!panelRef.current.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown, true);
      window.requestAnimationFrame(() => openerRef.current?.focus());
    };
  }, []);

  return (
    <section
      ref={panelRef}
      className="chord-share-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div className="chord-share-panel__header">
        <h2 id={titleId}>{chordName} 코드 공유</h2>
        <button
          ref={closeButtonRef}
          type="button"
          className="chord-share-panel__close"
          aria-label="코드 공유 창 닫기"
          onClick={onClose}
        >
          닫기
        </button>
      </div>

      <p id={descriptionId}>카메라로 QR 코드를 스캔하거나 링크를 복사해 공유하세요.</p>
      <div className="chord-share-panel__qr">
        <QRCodeSVG
          value={url}
          size={192}
          level="M"
          marginSize={4}
          role="img"
          title={`${chordName} 코드 공유 QR 코드`}
        />
      </div>

      <output className="chord-share-panel__url" aria-label="공유 링크">
        {url}
      </output>
      <div className="chord-share-panel__actions">
        <button type="button" className="chord-share-panel__copy" onClick={onCopy}>
          링크 복사
        </button>
        <a className="chord-share-panel__open" href={url} target="_blank" rel="noreferrer">
          링크 열기
        </a>
      </div>
      <p className="chord-share-panel__status" role="status" aria-live="polite" aria-atomic="true">
        {copyStatus}
      </p>
    </section>
  );
}

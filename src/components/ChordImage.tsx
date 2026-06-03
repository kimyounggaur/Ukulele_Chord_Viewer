import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

const PLACEHOLDER_SRC = `${import.meta.env.BASE_URL}chords/placeholders/chord-placeholder.svg`;

interface ChordImageProps {
  src: string;
  alt: string;
  size?: "thumb" | "large";
  overlay?: ReactNode;
}

interface ImageBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function ChordImage({ src, alt, size = "thumb", overlay }: ChordImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [imageBox, setImageBox] = useState<ImageBox | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const hasOverlay = Boolean(overlay);

  useEffect(() => {
    setCurrentSrc(src);
    setImageBox(null);
  }, [src]);

  const updateImageBox = useCallback(() => {
    const frame = frameRef.current;
    const image = imageRef.current;

    if (!frame || !image || !image.complete) {
      return;
    }

    const frameRect = frame.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();

    if (imageRect.width === 0 || imageRect.height === 0) {
      return;
    }

    const nextBox = {
      left: imageRect.left - frameRect.left,
      top: imageRect.top - frameRect.top,
      width: imageRect.width,
      height: imageRect.height,
    };

    setImageBox((previousBox) => {
      if (
        previousBox &&
        Math.abs(previousBox.left - nextBox.left) < 0.5 &&
        Math.abs(previousBox.top - nextBox.top) < 0.5 &&
        Math.abs(previousBox.width - nextBox.width) < 0.5 &&
        Math.abs(previousBox.height - nextBox.height) < 0.5
      ) {
        return previousBox;
      }

      return nextBox;
    });
  }, []);

  useLayoutEffect(() => {
    if (!hasOverlay) {
      return undefined;
    }

    updateImageBox();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateImageBox);
      return () => window.removeEventListener("resize", updateImageBox);
    }

    const observer = new ResizeObserver(updateImageBox);

    if (frameRef.current) {
      observer.observe(frameRef.current);
    }

    if (imageRef.current) {
      observer.observe(imageRef.current);
    }

    window.addEventListener("resize", updateImageBox);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateImageBox);
    };
  }, [currentSrc, hasOverlay, updateImageBox]);

  return (
    <div
      ref={frameRef}
      className={[
        "chord-image-frame rounded-lg bg-white",
        size === "large" ? "p-3 shadow-neo" : "p-2 shadow-neo-inset",
      ].join(" ")}
    >
      <img
        ref={imageRef}
        src={currentSrc}
        alt={alt}
        loading="lazy"
        className="chord-image"
        onLoad={updateImageBox}
        onError={() => {
          if (currentSrc !== PLACEHOLDER_SRC) {
            setCurrentSrc(PLACEHOLDER_SRC);
          }
        }}
      />
      {overlay && imageBox ? (
        <div
          className="chord-image-overlay"
          style={{
            left: imageBox.left,
            top: imageBox.top,
            width: imageBox.width,
            height: imageBox.height,
          }}
        >
          {overlay}
        </div>
      ) : null}
    </div>
  );
}

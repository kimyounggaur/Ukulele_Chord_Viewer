import {
  type MouseEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

interface ChordImageProps {
  src: string;
  webpSrc?: string;
  alt: string;
  width?: number;
  height?: number;
  size?: "thumb" | "large";
  overlay?: ReactNode;
  onError?: () => void;
  priority?: boolean;
}

interface ImageBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

function preventImageContextMenu(event: MouseEvent) {
  event.preventDefault();
}

export function ChordImage({
  src,
  webpSrc,
  alt,
  width = 720,
  height = 540,
  size = "thumb",
  overlay,
  onError,
  priority = false,
}: ChordImageProps) {
  const [imageBox, setImageBox] = useState<ImageBox | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [webpFailed, setWebpFailed] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const hasOverlay = Boolean(overlay);

  useEffect(() => {
    setImageBox(null);
    setLoaded(false);
    setWebpFailed(false);
  }, [src, webpSrc]);

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
  }, [hasOverlay, src, updateImageBox, webpFailed, webpSrc]);

  return (
    <div
      ref={frameRef}
      onContextMenu={preventImageContextMenu}
      className={[
        "chord-image-frame rounded-lg bg-white",
        size === "large" ? "p-3 shadow-neo" : "p-2 shadow-neo-inset",
      ].join(" ")}
    >
      {!loaded ? <div className="chord-image-skeleton" aria-hidden="true" /> : null}
      <picture className="chord-image-picture">
        {webpSrc && !webpFailed ? <source srcSet={webpSrc} type="image/webp" /> : null}
        <img
          key={webpFailed ? `${src}:fallback` : `${webpSrc ?? src}:preferred`}
          ref={imageRef}
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={size === "thumb" ? "lazy" : priority ? "eager" : "lazy"}
          decoding="async"
          {...{ fetchpriority: priority ? "high" : "auto" }}
          className={loaded ? "chord-image is-loaded" : "chord-image"}
          draggable={false}
          onContextMenu={preventImageContextMenu}
          onLoad={() => {
            setLoaded(true);
            updateImageBox();
          }}
          onError={() => {
            if (webpSrc && !webpFailed) {
              setLoaded(false);
              setWebpFailed(true);
              return;
            }
            onError?.();
          }}
        />
      </picture>
      {loaded && overlay && imageBox ? (
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

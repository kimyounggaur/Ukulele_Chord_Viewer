import { useEffect, useState } from "react";

const PLACEHOLDER_SRC = "/chords/placeholders/chord-placeholder.svg";

interface ChordImageProps {
  src: string;
  alt: string;
  size?: "thumb" | "large";
}

export function ChordImage({ src, alt, size = "thumb" }: ChordImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    setCurrentSrc(src);
  }, [src]);

  return (
    <div
      className={[
        "chord-image-frame rounded-lg bg-white",
        size === "large" ? "p-3 shadow-neo" : "p-2 shadow-neo-inset",
      ].join(" ")}
    >
      <img
        src={currentSrc}
        alt={alt}
        loading="lazy"
        className="chord-image"
        onError={() => {
          if (currentSrc !== PLACEHOLDER_SRC) {
            setCurrentSrc(PLACEHOLDER_SRC);
          }
        }}
      />
    </div>
  );
}

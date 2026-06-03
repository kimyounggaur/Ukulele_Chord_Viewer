export function rootToSlug(root: string): string {
  const normalizedRoot = root.trim();
  if (normalizedRoot === "B") {
    return "b";
  }

  return normalizedRoot.toLowerCase().replace(/#/g, "-sharp").replace(/b/g, "-flat");
}

export function normalizeSearchText(value: string): string {
  const compactValue = value
    .trim()
    .replace(/♯/g, "#")
    .replace(/♭/g, "b")
    .replace(/\s+/g, "");

  return compactValue
    .replace(/M7/g, "maj7")
    .replace(/△7/g, "maj7")
    .replace(/Δ7/g, "maj7")
    .replace(/m7\(?b5\)?/gi, "m7b5")
    .replace(/m7-5/gi, "m7b5")
    .toLowerCase();
}

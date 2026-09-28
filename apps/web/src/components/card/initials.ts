/**
 * Up to two initials for an avatar without a photo: the first letter of the
 * first and of the last word — "Ilyas Zhantureyev" → "IZ", "Айгерим" → "А".
 * Punctuation-only words are skipped; an empty name gives "".
 */
export function initials(name: string): string {
  const words = name
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter(Boolean);
  if (words.length === 0) return "";
  const first = words[0];
  const last = words.length > 1 ? words[words.length - 1] : "";
  return `${firstChar(first)}${firstChar(last)}`.toUpperCase();
}

/** The first *character*, not the first UTF-16 unit — surrogate pairs stay whole. */
function firstChar(word: string): string {
  const [ch] = Array.from(word);
  return ch ?? "";
}

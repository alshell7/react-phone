import type { Caller } from "./types.ts";

/** A suggested contact for the digits typed so far, with match ranges for highlighting. */
export interface ContactMatch {
  contact: Caller;
  /** Character ranges [start, end) to highlight in `contact.name`. */
  nameRanges: Array<[number, number]>;
  /** Character ranges [start, end) to highlight in `contact.number`. */
  numberRanges: Array<[number, number]>;
  /** Higher is better. */
  score: number;
  source: "contacts" | "recents";
}

const KEYS: Readonly<Record<string, string>> = {
  a: "2",
  b: "2",
  c: "2",
  d: "3",
  e: "3",
  f: "3",
  g: "4",
  h: "4",
  i: "4",
  j: "5",
  k: "5",
  l: "5",
  m: "6",
  n: "6",
  o: "6",
  p: "7",
  q: "7",
  r: "7",
  s: "7",
  t: "8",
  u: "8",
  v: "8",
  w: "9",
  x: "9",
  y: "9",
  z: "9",
};

/** Keypad digit for a letter (2 = ABC … 9 = WXYZ); digits map to themselves. */
export function keypadDigit(character: string): string {
  const lower = character.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  if (/^[0-9*#+]$/.test(lower)) return lower;
  return KEYS[lower] ?? "";
}

/** Text as keypad digits, e.g. "Alex" → "2539". Characters without a key are dropped. */
export function toKeypadDigits(text: string): string {
  return Array.from(text, keypadDigit).join("");
}

/** Digits a person can type for a dial query: 0–9, *, #, and +. */
export function dialQuery(value: string): string {
  return value.replace(/[^0-9*#+]/g, "");
}

function numberMatch(
  number: string,
  query: string,
): { ranges: Array<[number, number]>; prefix: boolean } | null {
  // Map each dialable character of the formatted number back to its index.
  const indices: number[] = [];
  let digits = "";
  for (let i = 0; i < number.length; i++)
    if (/[0-9*#+]/.test(number[i])) {
      indices.push(i);
      digits += number[i];
    }
  const at = digits.indexOf(query);
  if (at < 0) return null;
  return {
    ranges: [[indices[at], indices[at + query.length - 1] + 1]],
    prefix: at === 0 || (at === 1 && digits[0] === "+"),
  };
}

function nameMatch(
  name: string,
  query: string,
): { ranges: Array<[number, number]>; score: number } | null {
  if (!/^[2-9]+$/.test(query)) return null;
  const words = Array.from(name.matchAll(/[^\s\-_.,()]+/g), (m) => ({
    text: m[0],
    start: m.index ?? 0,
  }));
  // Word prefix, e.g. "626" → "Morgan".
  for (let w = 0; w < words.length; w++) {
    const word = words[w];
    let typed = "";
    let end = word.start;
    for (let i = 0; i < word.text.length && typed.length < query.length; i++) {
      const digit = keypadDigit(word.text[i]);
      end = word.start + i + 1;
      if (digit) typed += digit;
    }
    if (typed === query)
      return { ranges: [[word.start, end]], score: w === 0 ? 90 : 75 };
  }
  // Initials, e.g. "26" → "Alex Morgan".
  if (query.length >= 2 && query.length <= words.length) {
    const initials = words.map((word) => keypadDigit(word.text[0]));
    for (let start = 0; start + query.length <= words.length; start++)
      if (initials.slice(start, start + query.length).join("") === query)
        return {
          ranges: words
            .slice(start, start + query.length)
            .map((word) => [word.start, word.start + 1] as [number, number]),
          score: 70,
        };
  }
  return null;
}

/**
 * Smart-dial matching used by the keypad suggestions: numbers by digits (prefix first)
 * and names by keypad letters (word prefixes, then initials). Duplicates by number are
 * merged, preferring your contact list over Recents.
 */
export function matchContacts(
  value: string,
  sources: { contacts?: readonly Caller[]; recents?: readonly Caller[] },
  limit = 5,
): ContactMatch[] {
  const query = dialQuery(value);
  if (!query) return [];
  const seen = new Set<string>();
  const matches: ContactMatch[] = [];
  const consider = (
    contact: Caller,
    source: ContactMatch["source"],
    order: number,
  ) => {
    const key = dialQuery(contact.number);
    if (!key || seen.has(key)) return;
    const number = numberMatch(contact.number, query);
    const name = contact.name ? nameMatch(contact.name, query) : null;
    if (!number && !name) return;
    seen.add(key);
    const exact = key === query ? 30 : 0;
    const score =
      Math.max(number ? (number.prefix ? 100 : 60) : 0, name?.score ?? 0) +
      exact +
      (source === "contacts" ? 5 : 0) -
      order * 0.001;
    matches.push({
      contact,
      source,
      score,
      numberRanges: number?.ranges ?? [],
      nameRanges: name?.ranges ?? [],
    });
  };
  sources.contacts?.forEach((contact, i) => consider(contact, "contacts", i));
  sources.recents?.forEach((contact, i) => consider(contact, "recents", i));
  return matches.sort((a, b) => b.score - a.score).slice(0, Math.max(0, limit));
}
